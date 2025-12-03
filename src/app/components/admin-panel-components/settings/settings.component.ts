import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AdminHeaderComponent } from '../../admin-maintenance-components/admin-header/admin-header.component';
import { AuthService } from '../../../services/auth-service/auth.service';

interface RestaurantConfig {
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
}

interface PaymentConfig {
  provider: 'mercado_pago' | 'stripe' | 'pagseguro' | 'asaas' | 'none';
  enabled: boolean;
  publicKey: string;
  accessToken: string;
  pixEnabled: boolean;
  creditCardEnabled: boolean;
  debitCardEnabled: boolean;
  webhookUrl: string;
}

interface POSTerminalConfig {
  enabled: boolean;
  terminalType:
    | 'stone'
    | 'pagseguro_moderninha'
    | 'mercadopago_point'
    | 'cielo_lio'
    | 'getnet'
    | 'none';
  connectionType: 'wifi' | 'bluetooth' | 'usb';
  ipAddress: string;
  port: number;
  deviceId: string;
  stoneCode: string; // Para Stone
  serialNumber: string;
  autoConfirm: boolean; // Confirma automaticamente quando POS aprovar
}

interface EmailConfig {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

interface DatabaseConfig {
  uri: string;
  backupEnabled: boolean;
  backupRetentionDays: number;
}

interface SystemConfig {
  restaurant: RestaurantConfig;
  payment: PaymentConfig;
  posTerminal: POSTerminalConfig;
  email: EmailConfig;
  database: DatabaseConfig;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminHeaderComponent],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = false;
  saving = false;
  testingPOS = false;
  activeTab: 'restaurant' | 'payment' | 'pos' | 'email' | 'database' = 'restaurant';

  config: SystemConfig = {
    restaurant: {
      name: '',
      cnpj: '',
      phone: '',
      email: '',
      address: '',
    },
    payment: {
      provider: 'none',
      enabled: false,
      publicKey: '',
      accessToken: '',
      pixEnabled: false,
      creditCardEnabled: false,
      debitCardEnabled: false,
      webhookUrl: '',
    },
    posTerminal: {
      enabled: false,
      terminalType: 'none',
      connectionType: 'wifi',
      ipAddress: '',
      port: 8080,
      deviceId: '',
      stoneCode: '',
      serialNumber: '',
      autoConfirm: true,
    },
    email: {
      enabled: false,
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      user: '',
      password: '',
      from: '',
    },
    database: {
      uri: '',
      backupEnabled: true,
      backupRetentionDays: 7,
    },
  };

  // Providers disponíveis
  paymentProviders = [
    { value: 'none', label: 'Desabilitado', icon: '🚫' },
    { value: 'mercado_pago', label: 'Mercado Pago', icon: '💳' },
    { value: 'stripe', label: 'Stripe', icon: '💳' },
    { value: 'pagseguro', label: 'PagSeguro', icon: '💳' },
    { value: 'asaas', label: 'Asaas', icon: '💳' },
  ];

  // POS Terminals disponíveis
  posTerminals = [
    { value: 'none', label: 'Desabilitado', icon: '🚫' },
    { value: 'stone', label: 'Stone (Ton)', icon: '💳' },
    { value: 'pagseguro_moderninha', label: 'PagSeguro Moderninha', icon: '💳' },
    { value: 'mercadopago_point', label: 'Mercado Pago Point', icon: '💳' },
    { value: 'cielo_lio', label: 'Cielo LIO', icon: '💳' },
    { value: 'getnet', label: 'GetNet', icon: '💳' },
  ];

  connectionTypes = [
    { value: 'wifi', label: 'WiFi (Rede Local)', icon: '📡' },
    { value: 'bluetooth', label: 'Bluetooth', icon: '📲' },
    { value: 'usb', label: 'USB', icon: '🔌' },
  ];

  // SMTP Providers
  emailProviders = [
    { value: 'gmail', host: 'smtp.gmail.com', port: 587, label: 'Gmail' },
    { value: 'outlook', host: 'smtp-mail.outlook.com', port: 587, label: 'Outlook' },
    { value: 'yahoo', host: 'smtp.mail.yahoo.com', port: 587, label: 'Yahoo' },
    { value: 'sendgrid', host: 'smtp.sendgrid.net', port: 587, label: 'SendGrid' },
  ];

  ngOnInit() {
    // Verificar permissão - Admins sempre têm acesso
    const isAdmin = this.authService.isAdmin();
    const hasPermission = this.authService.canManageSystemSettings();

    if (!isAdmin && !hasPermission) {
      alert('❌ Você não tem permissão para acessar esta página');
      this.router.navigate(['/maintenance/admin-tools']);
      return;
    }
    this.loadConfig();
  }

  async loadConfig() {
    this.loading = true;
    try {
      const token = localStorage.getItem('auth_token');
      const response = await this.http
        .get<SystemConfig>(`${environment.apiUrl}/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .toPromise();
      if (response) {
        this.config = response;
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      alert('❌ Erro ao carregar configurações');
    } finally {
      this.loading = false;
    }
  }

  async saveConfig() {
    // Validações
    if (this.activeTab === 'restaurant') {
      if (!this.config.restaurant.name) {
        alert('⚠️ Nome do restaurante é obrigatório');
        return;
      }
    }

    if (this.activeTab === 'payment') {
      if (this.config.payment.enabled) {
        if (!this.config.payment.publicKey || !this.config.payment.accessToken) {
          alert('⚠️ Preencha as credenciais do gateway de pagamento');
          return;
        }
        if (
          !this.config.payment.pixEnabled &&
          !this.config.payment.creditCardEnabled &&
          !this.config.payment.debitCardEnabled
        ) {
          alert('⚠️ Habilite pelo menos um método de pagamento');
          return;
        }
      }
    }

    if (this.activeTab === 'email') {
      if (this.config.email.enabled) {
        if (!this.config.email.user || !this.config.email.password || !this.config.email.from) {
          alert('⚠️ Preencha todas as credenciais de email');
          return;
        }
      }
    }

    this.saving = true;
    try {
      const token = localStorage.getItem('auth_token');
      await this.http
        .put(`${environment.apiUrl}/settings`, this.config, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .toPromise();
      alert(
        '✅ Configurações salvas com sucesso!\n\n⚠️ Reinicie o servidor para aplicar as mudanças.'
      );
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('❌ Erro ao salvar configurações');
    } finally {
      this.saving = false;
    }
  }

  async testPaymentConnection() {
    if (!this.config.payment.publicKey || !this.config.payment.accessToken) {
      alert('⚠️ Preencha as credenciais primeiro');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const result = await this.http
        .post<any>(
          `${environment.apiUrl}/settings/test-payment`,
          {
            provider: this.config.payment.provider,
            publicKey: this.config.payment.publicKey,
            accessToken: this.config.payment.accessToken,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        .toPromise();

      if (result?.success) {
        alert('✅ Conexão testada com sucesso!');
      } else {
        alert('❌ Erro na conexão: ' + (result?.message || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      alert('❌ Erro ao testar conexão com o gateway');
    }
  }

  async testPOSConnection() {
    if (this.config.posTerminal.terminalType === 'none') {
      alert('⚠️ Selecione um tipo de terminal primeiro');
      return;
    }

    if (this.config.posTerminal.connectionType === 'wifi' && !this.config.posTerminal.ipAddress) {
      alert('⚠️ Preencha o endereço IP da maquininha');
      return;
    }

    this.testingPOS = true;
    try {
      const token = localStorage.getItem('auth_token');
      const result = await this.http
        .post<any>(
          `${environment.apiUrl}/settings/test-pos`,
          {
            terminalType: this.config.posTerminal.terminalType,
            connectionType: this.config.posTerminal.connectionType,
            ipAddress: this.config.posTerminal.ipAddress,
            port: this.config.posTerminal.port,
            deviceId: this.config.posTerminal.deviceId,
            stoneCode: this.config.posTerminal.stoneCode,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        .toPromise();

      if (result?.success) {
        alert('✅ Conexão com maquininha testada com sucesso!\n\n' + result.message);
      } else {
        alert(
          '❌ Erro na conexão: ' + (result?.message || 'Não foi possível conectar à maquininha')
        );
      }
    } catch (error) {
      console.error('Erro ao testar conexão POS:', error);
      alert('❌ Erro ao testar conexão com a maquininha');
    } finally {
      this.testingPOS = false;
    }
  }

  async testEmailConnection() {
    if (!this.config.email.user || !this.config.email.password) {
      alert('⚠️ Preencha as credenciais de email primeiro');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const result = await this.http
        .post<any>(
          `${environment.apiUrl}/settings/test-email`,
          {
            host: this.config.email.host,
            port: this.config.email.port,
            secure: this.config.email.secure,
            user: this.config.email.user,
            password: this.config.email.password,
            from: this.config.email.from,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        .toPromise();

      if (result?.success) {
        alert('✅ Email de teste enviado com sucesso!\n\nVerifique sua caixa de entrada.');
      } else {
        alert('❌ Erro ao enviar email: ' + (result?.message || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao testar email:', error);
      alert('❌ Erro ao testar conexão SMTP');
    }
  }

  async testDatabaseConnection() {
    try {
      const token = localStorage.getItem('auth_token');
      const result = await this.http
        .post<any>(
          `${environment.apiUrl}/settings/test-database`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        .toPromise();

      if (result?.success) {
        alert(
          `✅ Conexão com banco de dados OK!\n\nPing: ${result.ping}ms\nDocumentos: ${result.count || 0}`
        );
      } else {
        alert('❌ Erro na conexão com banco de dados');
      }
    } catch (error) {
      console.error('Erro ao testar database:', error);
      alert('❌ Erro ao conectar ao banco de dados');
    }
  }

  async createBackup() {
    if (!confirm('Deseja criar um backup do banco de dados agora?')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const result = await this.http
        .post<any>(
          `${environment.apiUrl}/settings/backup`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        .toPromise();

      if (result?.success) {
        alert(
          `✅ Backup criado com sucesso!\n\nArquivo: ${result.filename}\nTamanho: ${result.size}`
        );
      } else {
        alert('❌ Erro ao criar backup');
      }
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      alert('❌ Erro ao criar backup');
    }
  }

  selectEmailProvider(provider: any) {
    this.config.email.host = provider.host;
    this.config.email.port = provider.port;
    this.config.email.secure = false;
  }

  getProviderDocs(provider: string): string {
    const docs: Record<string, string> = {
      mercado_pago: 'https://www.mercadopago.com.br/developers/pt/docs',
      stripe: 'https://stripe.com/docs',
      pagseguro: 'https://dev.pagseguro.uol.com.br/reference',
      asaas: 'https://docs.asaas.com/',
    };
    return docs[provider] || '#';
  }

  formatCNPJ(value: string): string {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  }

  formatPhone(value: string): string {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  }

  onCNPJInput(event: any) {
    this.config.restaurant.cnpj = this.formatCNPJ(event.target.value);
  }

  onPhoneInput(event: any) {
    this.config.restaurant.phone = this.formatPhone(event.target.value);
  }
}
