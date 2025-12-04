import { of } from 'rxjs';

/**
 * Mock do ActivatedRoute para testes unitários
 * Inclui todas as propriedades necessárias do ActivatedRoute
 */
export const createActivatedRouteMock = (
  overrides: Partial<{
    params: any;
    queryParams: any;
    fragment: string;
    data: any;
    url: any[];
  }> = {}
) => ({
  params: of(overrides.params || {}),
  queryParams: of(overrides.queryParams || {}),
  fragment: of(overrides.fragment || ''),
  data: of(overrides.data || {}),
  url: of(overrides.url || []),
  outlet: 'primary',
  routeConfig: null,
  parent: null,
  firstChild: null,
  children: [],
  pathFromRoot: [],
  paramMap: of(new Map()),
  queryParamMap: of(new Map()),
});

/**
 * Mock simplificado do ActivatedRoute com valores padrão
 */
export const defaultActivatedRouteMock = createActivatedRouteMock();
