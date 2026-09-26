import "./Aplicativo.css";
import { useEffect, useRef, useState } from "react";
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

const mensagemInicial = {
  id: "mensagem-inicial",
  autor: "Atendimento",
  texto: "Olá! Você entrou na fila do atendimento por texto. Como podemos ajudar?",
};

function App() {

const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [emAtendimento, setEmAtendimento] = useState(false);
  const [emChat, setEmChat] = useState(false);
  const [emAgendamento, setEmAgendamento] = useState(false);
  const [agendamentoConfirmado, setAgendamentoConfirmado] = useState(null);
  const [dadosAgendamento, setDadosAgendamento] = useState({
    nome: "",
    modalidade: "Libras",
    data: "",
    horario: "",
  });
  const [mensagem, setMensagem] = useState("");
  const [mensagens, setMensagens] = useState([mensagemInicial]);
  const [idConversa] = useState(() => {
    const idSalvo = window.localStorage.getItem("islibras-conversa-id");
    const novoId = idSalvo || crypto.randomUUID();

    window.localStorage.setItem("islibras-conversa-id", novoId);
    return novoId;
  });

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function abrirCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;
      setEmAtendimento(true);
      setCameraAtiva(true);
    } catch (error) {
      alert("Não foi possível acessar a câmera. Verifique a permissão.");
      console.error(error);
    }
  }
    function encerrarEspera() {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraAtiva(false);
      setEmAtendimento(false);
    }

    useEffect(() => {
      if (emAtendimento && videoRef.current && streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
    }, [emAtendimento]);

    useEffect(() => {
      if (!emChat) {
        return undefined;
      }

      const mensagensRef = collection(db, "conversas", idConversa, "mensagens");
      const mensagensQuery = query(mensagensRef, orderBy("criadoEm", "asc"));
      const cancelarEscuta = onSnapshot(
        mensagensQuery,
        (snapshot) => {
          const mensagensDoBanco = snapshot.docs.map((documento) => ({
            id: documento.id,
            ...documento.data(),
          }));

          setMensagens([mensagemInicial, ...mensagensDoBanco]);
        },
        (error) => {
          console.error("Não foi possível carregar as mensagens:", error);
        }
      );

      return cancelarEscuta;
    }, [emChat, idConversa]);

    async function enviarMensagem(event) {
      event.preventDefault();
      const texto = mensagem.trim();

      if (!texto) {
        return;
      }

      try {
        await addDoc(collection(db, "conversas", idConversa, "mensagens"), {
          autor: "Você",
          texto,
          criadoEm: serverTimestamp(),
        });
        setMensagem("");
      } catch (error) {
        console.error("Não foi possível enviar a mensagem:", error);
        alert("Não foi possível enviar a mensagem. Verifique a conexão.");
      }
    }

    function atualizarAgendamento(event) {
      const { name, value } = event.target;
      setDadosAgendamento((dadosAtuais) => ({ ...dadosAtuais, [name]: value }));
    }

    function confirmarAgendamento(event) {
      event.preventDefault();
      setAgendamentoConfirmado(dadosAgendamento);
    }

    function fecharAgendamento() {
      setEmAgendamento(false);
      setAgendamentoConfirmado(null);
    }

    if (emChat) {
      return (
        <main className="waiting-screen">
          <section className="chat-panel" aria-live="polite">
            <div className="chat-header">
              <div>
                <p className="eyebrow">Atendimento por texto</p>
                <h1>Chat ao vivo</h1>
              </div>
              <span className="online-status"><span aria-hidden="true" /> Online</span>
            </div>

            <p className="waiting-message">
              Você está na fila. Nossa equipe responderá assim que o atendimento
              estiver disponível.
            </p>

            <div className="chat-messages" aria-label="Mensagens do atendimento">
              {mensagens.map((item) => (
                <div
                  className={`chat-message ${item.autor === "Você" ? "sent" : "received"}`}
                  key={item.id}
                >
                  <span>{item.autor}</span>
                  <p>{item.texto}</p>
                </div>
              ))}
            </div>

            <form className="chat-form" onSubmit={enviarMensagem}>
              <label className="sr-only" htmlFor="mensagem">Digite sua mensagem</label>
              <input
                id="mensagem"
                value={mensagem}
                onChange={(event) => setMensagem(event.target.value)}
                placeholder="Digite sua mensagem"
                autoComplete="off"
              />
              <button type="submit">Enviar</button>
            </form>
            <button className="secondary-button" onClick={() => setEmChat(false)}>
              Voltar
            </button>
          </section>
        </main>
      );
    }

    if (emAtendimento) {
      return (
        <main className="waiting-screen">
          <section className="waiting-panel" aria-live="polite">
            <p className="eyebrow">Atendimento em Libras</p>
            <h1>Aguardando o atendimento</h1>
            <p className="waiting-message">
              Sua câmera está ligada. Em breve, uma pessoa da nossa equipe entrará
              em contato com você.
            </p>

            <div className="camera-frame">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                aria-label="Imagem da câmera durante a espera pelo atendimento"
              />
              {!cameraAtiva && <p>Iniciando câmera...</p>}
            </div>

            <p className="camera-status">
              <span aria-hidden="true" /> Câmera ligada
            </p>
            <button className="secondary-button" onClick={encerrarEspera}>
              Voltar
            </button>
          </section>
        </main>
      );
    }

    if (emAgendamento) {
      return (
        <main className="waiting-screen">
          <section className="schedule-panel" aria-live="polite">
            {agendamentoConfirmado ? (
              <div className="schedule-confirmation">
                <p className="eyebrow">Agendamento confirmado</p>
                <h1>Seu atendimento está marcado</h1>
                <p className="waiting-message">
                  Reservamos um horário para você. Nossa equipe estará preparada
                  para atender sua necessidade.
                </p>
                <div className="appointment-summary">
                  <strong>{agendamentoConfirmado.nome}</strong>
                  <span>{agendamentoConfirmado.modalidade}</span>
                  <span>{agendamentoConfirmado.data} às {agendamentoConfirmado.horario}</span>
                </div>
                <button className="secondary-button" onClick={fecharAgendamento}>
                  Voltar
                </button>
              </div>
            ) : (
              <>
                <p className="eyebrow">Agendamento</p>
                <h1>Escolha seu horário</h1>
                <p className="waiting-message">
                  Preencha os dados abaixo para marcar um atendimento com nossa equipe.
                </p>
                <form className="schedule-form" onSubmit={confirmarAgendamento}>
                  <label htmlFor="nome">Nome</label>
                  <input
                    id="nome"
                    name="nome"
                    value={dadosAgendamento.nome}
                    onChange={atualizarAgendamento}
                    placeholder="Como podemos chamar você?"
                    required
                  />

                  <label htmlFor="modalidade">Tipo de atendimento</label>
                  <select
                    id="modalidade"
                    name="modalidade"
                    value={dadosAgendamento.modalidade}
                    onChange={atualizarAgendamento}
                  >
                    <option>Libras</option>
                    <option>Texto</option>
                    <option>Videochamada</option>
                  </select>

                  <div className="schedule-fields">
                    <div>
                      <label htmlFor="data">Data</label>
                      <input
                        id="data"
                        name="data"
                        type="date"
                        value={dadosAgendamento.data}
                        onChange={atualizarAgendamento}
                        min={new Date().toISOString().split("T")[0]}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="horario">Horário</label>
                      <input
                        id="horario"
                        name="horario"
                        type="time"
                        value={dadosAgendamento.horario}
                        onChange={atualizarAgendamento}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit">Confirmar agendamento</button>
                </form>
                <button className="secondary-button" onClick={fecharAgendamento}>
                  Voltar
                </button>
              </>
            )}
          </section>
        </main>
      );
    }




  return (
    <div className="container">
      <header className="header">
        <h1>IsLibras Food App</h1>
        <h1>Atendimento ao Surdo</h1>
        <p>Canal acessível para atendimento em Libras e o Chat.</p>
      </header>

      <section className="banner">
        <div>
          <h2>Bem-vindo(a)!</h2>
          <p>
            Escolha abaixo o tipo de atendimento desejado. Nossa equipe está
            pronta para ajudar com acessibilidade e respeito.
          </p>

        </div>
      </section>

      <section className="cards">
        <div className="card">
          <h3>Atendimento em Libras</h3>
          <p>Solicite atendimento com pessoa fluente em Libras.</p>
           <button onClick={abrirCamera}>Iniciar o atendimento</button>
        </div>

        <div className="card">
          <h3>Atendimento por Texto</h3>
          <p>Envie sua dúvida por mensagem escrita.</p>
          <button onClick={() => setEmChat(true)}>Iniciar o chat</button>
        </div>

        <div className="card">
          <h3>Agendamento</h3>
          <p>Marque horário para atendimento presencial ou online.</p>
          <button onClick={() => setEmAgendamento(true)}>Agendar atendimento</button>
        </div>
      </section>
<footer>
  <p>
    © 2026 Aplicativo IsLibras Food | Desenvolvido por Leticia Honorio
  </p>
</footer>
    </div>
  );
}

export default App;