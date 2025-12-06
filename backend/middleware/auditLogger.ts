import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models';

/**
 * Middleware para registrar operações sensíveis no sistema
 * @param action - Tipo de ação sendo executada (ex: EXPORT_SALES_REPORT)
 * @param resource - Recurso sendo acessado (ex: reports, users, products)
 */
export const auditLog = (action: string, resource: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    const originalJson = res.json;

    let responseBody: any;
    let resourceId: string | undefined;

    // Captura o corpo da resposta
    res.send = function (data: any) {
      responseBody = data;
      res.send = originalSend;
      return res.send(data);
    };

    res.json = function (data: any) {
      responseBody = data;
      res.json = originalJson;
      return res.json(data);
    };

    // Extrai dados do usuário autenticado
    const userId = (req as any).user?.userId || (req as any).user?._id || (req as any).user?.id;
    const userEmail = (req as any).user?.email;

    // Extrai informações do request
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    // Tenta extrair o resourceId do corpo, params ou query
    resourceId = req.params['id'] || req.body['id'] || req.body['_id'];

    // Detalhes específicos da operação
    const details: any = {
      method: req.method,
      path: req.path,
      query: Object.keys(req.query).length > 0 ? req.query : undefined,
    };

    // Adiciona body para operações de criação/atualização (sem senhas)
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const sanitizedBody = { ...req.body };
      delete sanitizedBody.password;
      delete sanitizedBody.newPassword;
      delete sanitizedBody.currentPassword;
      details.body = sanitizedBody;
    }

    // Aguarda a conclusão da requisição
    res.on('finish', async () => {
      try {
        const success = res.statusCode >= 200 && res.statusCode < 300;
        let errorMessage: string | undefined;

        // Se falhou, tenta extrair mensagem de erro
        if (!success && responseBody) {
          try {
            const parsed =
              typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
            errorMessage = parsed.error || parsed.message || `HTTP ${res.statusCode}`;
          } catch {
            errorMessage = `HTTP ${res.statusCode}`;
          }
        }

        // Se a resposta contém um ID criado/atualizado, captura
        if (success && responseBody && !resourceId) {
          try {
            const parsed =
              typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
            resourceId = parsed.id || parsed._id || parsed.data?.id || parsed.data?._id;
          } catch {
            // Ignora erros de parse
          }
        }

        // Para LOGIN/REGISTER, capturar userId e userEmail da resposta
        let finalUserId = userId;
        let finalUserEmail = userEmail;

        if ((action === 'LOGIN' || action === 'REGISTER_USER') && success && responseBody) {
          try {
            const parsed =
              typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
            // Tentar extrair do user na resposta
            if (parsed.user) {
              finalUserId = parsed.user._id || parsed.user.id || finalUserId;
              finalUserEmail = parsed.user.email || finalUserEmail;
              // O resourceId para LOGIN/REGISTER é o próprio userId
              resourceId = finalUserId;
            }
          } catch {
            // Ignora erros de parse
          }
        }

        // Cria registro de auditoria
        await AuditLog.create({
          userId: finalUserId || null,
          userEmail: finalUserEmail || null,
          action,
          resource,
          resourceId: resourceId || undefined,
          ipAddress,
          userAgent,
          details,
          success,
          errorMessage,
        });
      } catch (error) {
        // Não falha a requisição se o log de auditoria falhar
        console.error('Erro ao criar log de auditoria:', error);
      }
    });

    next();
  };
};

/**
 * Função auxiliar para criar logs de auditoria manuais
 * (para operações que não passam por middleware HTTP)
 */
export const createAuditLog = async (
  action: string,
  resource: string,
  userId?: string,
  userEmail?: string,
  details?: any,
  resourceId?: string,
  success: boolean = true,
  errorMessage?: string
) => {
  try {
    await AuditLog.create({
      userId: userId || null,
      userEmail: userEmail || null,
      action,
      resource,
      resourceId,
      ipAddress: 'internal',
      userAgent: 'system',
      details: details || {},
      success,
      errorMessage,
    });
  } catch (error) {
    console.error('Erro ao criar log de auditoria manual:', error);
  }
};
