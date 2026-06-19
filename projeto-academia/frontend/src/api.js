const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// sessionStorage é por aba — cada aba mantém seu próprio token independente
export function setToken(t) {
  if (t) sessionStorage.setItem('gymbalance_token', t);
  else   sessionStorage.removeItem('gymbalance_token');
}
function getToken() {
  return sessionStorage.getItem('gymbalance_token') || localStorage.getItem('gymbalance_token');
}

async function request(method, path, body) {
  const options = { method, headers: {} };

  const token = getToken();
  if (token) options.headers['Authorization'] = `Bearer ${token}`;

  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE}${path}`, options);

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (res.status === 401) {
    localStorage.removeItem('gymbalance_token');
    localStorage.removeItem('gymbalance_usuario');
    window.dispatchEvent(new Event('gymbalance:logout'));
    return;
  }

  if (!res.ok) {
    throw new Error(data?.erro || `Erro ${res.status}`);
  }

  return data;
}

export const alunosApi = {
  listar:    ()            => request('GET',    '/alunos'),
  criar:     (dados)       => request('POST',   '/alunos',       dados),
  atualizar: (id, dados)   => request('PUT',    `/alunos/${id}`, dados),
  excluir:   (id)          => request('DELETE', `/alunos/${id}`),
  login:     (dados)       => request('POST',   '/alunos/login', dados),
};

export const professoresApi = {
  listar:    ()            => request('GET',    '/professores'),
  criar:     (dados)       => request('POST',   '/professores',       dados),
  atualizar: (id, dados)   => request('PUT',    `/professores/${id}`, dados),
  excluir:   (id)          => request('DELETE', `/professores/${id}`),
  login:     (dados)       => request('POST',   '/professores/login', dados),
};

export const donoApi = {
  obter:     ()            => request('GET',  '/donos'),
  registrar: (dados)       => request('POST', '/donos',       dados),
  atualizar: (id, dados)   => request('PUT',  `/donos/${id}`, dados),
  login:     (dados)       => request('POST', '/donos/login', dados),
};

export const fichasApi = {
  listar:    ()            => request('GET',    '/fichas'),
  criar:     (dados)       => request('POST',   '/fichas',       dados),
  atualizar: (id, dados)   => request('PUT',    `/fichas/${id}`, dados),
  excluir:   (id)          => request('DELETE', `/fichas/${id}`),
};

export const mensalidadesApi = {
  listar:    ()            => request('GET',    '/mensalidades'),
  criar:     (dados)       => request('POST',   '/mensalidades',       dados),
  atualizar: (id, dados)   => request('PUT',    `/mensalidades/${id}`, dados),
  excluir:   (id)          => request('DELETE', `/mensalidades/${id}`),
};

export const presencasApi = {
  listar:    ()                    => request('GET',    '/presencas'),
  criar:     (dados)               => request('POST',   '/presencas',       dados),
  excluir:   (id)                  => request('DELETE', `/presencas/${id}`),
  historico: (alunoId, mes, ano)   => request('GET',    `/presencas/historico/${alunoId}?mes=${mes}&ano=${ano}`),
};

export const pagamentoApi = {
  criarSessao: (mensalidadeId) => request('POST', '/pagamento/criar-sessao', { mensalidadeId }),
};

async function enviarFotoParaRota(rota, arquivo) {
  const form = new FormData();
  form.append('foto', arquivo);
  const token = getToken();
  const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const res  = await fetch(`${BASE}${rota}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.erro || 'Erro ao enviar foto.');
  return data;
}

export const uploadsApi = {
  enviarFoto:          (alunoId,      arquivo) => enviarFotoParaRota(`/uploads/foto/${alunoId}`,           arquivo),
  enviarFotoProfessor: (professorId,  arquivo) => enviarFotoParaRota(`/uploads/professor/${professorId}`,  arquivo),
  enviarFotoDono:      (donoId,       arquivo) => enviarFotoParaRota(`/uploads/dono/${donoId}`,            arquivo),
};
