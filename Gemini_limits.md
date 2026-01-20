Com base nos meus registros mais recentes (novembro de 2025) e na documentação oficial, aqui estão as respostas específicas para o seu caso de uso, incluindo a explicação sobre o "Nano Banana" e os parâmetros seguros para seus testes:
1. O que é o "Nano Banana"? 🍌
Você usou o termo correto! "Nano Banana" é o apelido oficial (e codinome interno) do modelo Gemini 2.5 Flash Image.[1][2][3][4]
Nome Técnico para API: gemini-2.5-flash-image (ou gemini-2.5-flash-image-preview).
Função: É um modelo rápido especializado em gerar e editar imagens.[1]
2. Por que sua conta bloqueou em 15 imagens?
Embora a documentação oficial cite um limite teórico de até 100 imagens por dia na conta gratuita, o sistema aplica limites dinâmicos baseados na demanda global dos servidores.
A Realidade: Muitos usuários relatam bloqueios temporários ("Resource Exhausted" ou erro 429) após gerar entre 10 a 20 imagens em horários de pico.
O Motivo: A geração de imagem é muito custosa computacionalmente. Quando o tráfego sobe, o Google prioriza contas pagas e "estrangula" o limite da conta Free para garantir estabilidade.
3. Parâmetros Seguros para seus Testes (Safe Parameters)
Para evitar que seu sistema de testes trave (erro 429), configure seu código com estes limites de segurança:
A. Para Criação de Imagens (Avatares)
Use o modelo gemini-2.5-flash-image (Nano Banana) com extrema cautela na conta Free.
Taxa Segura (RPM): 1 requisição a cada 2 minutos (para evitar o filtro de spam rápido).
Volume Diário Seguro (RPD): Limite seus testes a 10 imagens por dia para garantir que todas funcionem. Se precisar de mais, terá que esperar o "reset" (que ocorre meia-noite no horário do Pacífico, aprox. 04:00 ou 05:00 da manhã no Brasil).
Dica: Se seu código receber um erro 429, implemente uma lógica de "backoff" (esperar 60 segundos antes de tentar de novo), mas saiba que para imagens, esse bloqueio costuma durar até o dia seguinte.
B. Para o Assistente Virtual (Texto/Chat)
Aqui você tem muito mais folga. Use o modelo Gemini 1.5 Flash (gemini-1.5-flash).
Taxa Segura (RPM): Até 15 requisições por minuto (1 a cada 4 segundos).
Nota: O limite técnico pode chegar a ser maior, mas 15 RPM é a "zona verde" onde seu assistente não vai engasgar.
Volume Diário (RPD): Até 1.500 mensagens por dia.
Janela de Contexto: Pode enviar textos longos (histórico do chat), mas evite passar de 30.000 tokens (aprox. 20.000 palavras) por interação para manter a resposta rápida na versão Free.
Resumo para seu código (Configuração Recomendada):
Recurso	Modelo Recomendado	Limite Seguro (Rate Limit)	Limite Diário (Safe)
Imagens	gemini-2.5-flash-image	1 req a cada 120s	~10 a 15 img/dia
Texto/Chat	gemini-1.5-flash	15 req/minuto	~1.500 msg/dia
Se precisar escalar a geração de imagens (fazer 50 ou 100 avatares de uma vez), infelizmente a conta Free não vai suportar a carga concentrada; seria necessário migrar para o plano "Pay-as-you-go" (pagamento por uso) no Google AI Studio.