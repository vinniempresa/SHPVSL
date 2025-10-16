
// Adicionar esta função no console do navegador para limpar dados antigos:
function limparDadosAntigos() {
  console.log("🧹 Limpando dados antigos do localStorage...");
  localStorage.removeItem("candidato_data");
  localStorage.removeItem("user_data");
  localStorage.removeItem("user_name");
  localStorage.removeItem("user_cpf");
  console.log("✅ Dados limpos! Faça o cadastro novamente.");
  window.location.href = "/cadastro";
}
limparDadosAntigos();

