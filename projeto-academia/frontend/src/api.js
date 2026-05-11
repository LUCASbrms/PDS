const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function request(method, path, body) {
  const options = { method, headers: {} };
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE}${path}`, options);

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

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
};

export const professoresApi = {
  listar:    ()            => request('GET',    '/professores'),
  criar:     (dados)       => request('POST',   '/professores',       dados),
  atualizar: (id, dados)   => request('PUT',    `/professores/${id}`, dados),
  excluir:   (id)          => request('DELETE', `/professores/${id}`),
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
