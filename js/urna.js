
/* ========================================
   FAZ O L — SIMULADOR DE URNA
   Lógica e interações
======================================== */


/* ========================================
   1. CONFIGURAÇÕES E ESTADO
======================================== */

let currentNumber = '';
const maxDigits = 2;

let isBlank = false;
let voteCompleted = false;
let audioCtx = null;
let resetTimer = null;


/* ========================================
   2. BASE DE DADOS DOS CANDIDATOS
======================================== */

const candidates = {
    '13': {
        name: 'Luiz Inácio Lula da Silva',
        party: 'PT',
        vice: 'Geraldo Alckmin',
        img: 'assets/images/lula.jpg'
    }

    // Outros candidatos podem ser adicionados aqui.
};


/* ========================================
   3. ELEMENTOS DA TELA
======================================== */

const elements = {
    screenContent: document.getElementById('screen-content'),
    fimScreen: document.getElementById('fim-screen'),

    numberContainer: document.getElementById('number-container'),
    num0: document.getElementById('num-0'),
    num1: document.getElementById('num-1'),

    candidateInfo: document.getElementById('candidate-info'),
    candidatePhoto: document.getElementById('candidate-photo'),

    candidateName: document.getElementById('candidate-name'),
    candidateParty: document.getElementById('candidate-party'),
    candidateVice: document.getElementById('candidate-vice'),
    photoImg: document.getElementById('photo-img'),

    nullVoteInfo: document.getElementById('null-vote-info'),
    blankVoteInfo: document.getElementById('blank-vote-info'),

    instructions: document.getElementById('instructions'),
    votoParaText: document.getElementById('voto-para-text'),

    audioTecla: document.getElementById('audio-tecla'),
    audioConfirma: document.getElementById('audio-confirma')
};


/* ========================================
   4. SISTEMA DE ÁUDIO
======================================== */

// Inicializa o áudio do navegador.

function initAudio() {
    if (!audioCtx) {
        const AudioContext =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContext) return;

        audioCtx = new AudioContext();
    }

    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}


// Som sintetizado das teclas.

function synthesizeKeySound() {
    initAudio();

    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'sine';

    osc.frequency.setValueAtTime(
        1500,
        audioCtx.currentTime
    );

    gainNode.gain.setValueAtTime(
        0.1,
        audioCtx.currentTime
    );

    gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioCtx.currentTime + 0.1
    );

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}


// Reproduz o som da tecla.

function playKeySound() {
    const audio = elements.audioTecla;

    if (audio && audio.getAttribute('src')) {
        audio.currentTime = 0;

        audio.play().catch(() => {
            synthesizeKeySound();
        });
    } else {
        synthesizeKeySound();
    }
}


// Som sintetizado de confirmação.

function synthesizeConfirmSound() {
    initAudio();

    if (!audioCtx) return;

    const baseFreq = 1250;

    const notes = [
        { time: 0.00, duration: 0.06 },
        { time: 0.12, duration: 0.06 },
        { time: 0.24, duration: 0.06 },
        { time: 0.36, duration: 0.06 },
        { time: 0.48, duration: 1.20 }
    ];

    notes.forEach(note => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        const startTime = audioCtx.currentTime + note.time;
        const endTime = startTime + note.duration;

        osc.type = 'square';

        osc.frequency.setValueAtTime(
            baseFreq,
            startTime
        );

        gainNode.gain.setValueAtTime(0.05, startTime);

        gainNode.gain.setValueAtTime(
            0.05,
            endTime - 0.02
        );

        gainNode.gain.exponentialRampToValueAtTime(
            0.001,
            endTime
        );

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc.start(startTime);
        osc.stop(endTime);
    });
}


// Reproduz o som de confirmação.

function playConfirmSound() {
    const audio = elements.audioConfirma;

    if (audio && audio.getAttribute('src')) {
        audio.currentTime = 0;

        audio.play().catch(() => {
            synthesizeConfirmSound();
        });
    } else {
        synthesizeConfirmSound();
    }
}


/* ========================================
   5. DIGITAÇÃO DOS NÚMEROS
======================================== */

function typeNumber(num) {
    if (voteCompleted) return;

    playKeySound();

    // Se estava selecionado o voto em branco,
    // limpa a seleção antes de digitar.

    if (isBlank) {
        resetScreen(false);
    }

    // Limita a digitação a dois números.

    if (currentNumber.length < maxDigits) {
        currentNumber += num;
        updateScreen();
    }
}


/* ========================================
   6. VOTO EM BRANCO
======================================== */

function voteBlank() {
    if (voteCompleted) return;

    playKeySound();

    resetScreen(false);

    isBlank = true;

    elements.numberContainer.style.display = 'none';

    elements.blankVoteInfo.classList.remove('hidden');
    elements.instructions.classList.remove('hidden');
    elements.votoParaText.classList.remove('hidden');
}


/* ========================================
   7. CORRIGIR / REINICIAR VOTO
======================================== */

function resetScreen(playSound = true) {
    if (voteCompleted) return;

    if (playSound) {
        playKeySound();
    }

    currentNumber = '';
    isBlank = false;

    // Restaura os números.

    elements.numberContainer.style.display = 'flex';

    elements.num0.innerText = '';
    elements.num1.innerText = '';

    elements.num0.classList.add('blink');
    elements.num1.classList.remove('blink');

    // Esconde informações anteriores.

    elements.candidateInfo.classList.add('hidden');
    elements.candidatePhoto.classList.add('hidden');

    elements.nullVoteInfo.classList.add('hidden');
    elements.blankVoteInfo.classList.add('hidden');

    elements.instructions.classList.add('hidden');
    elements.votoParaText.classList.add('hidden');
}


/* ========================================
   8. ATUALIZAÇÃO DA TELA
======================================== */

function updateScreen() {

    // Atualiza os campos numéricos.

    for (let i = 0; i < maxDigits; i++) {
        const box = document.getElementById(`num-${i}`);

        if (i < currentNumber.length) {
            box.innerText = currentNumber[i];
            box.classList.remove('blink');
        } else {
            box.innerText = '';
            box.classList.remove('blink');
        }
    }

    // Faz o próximo campo piscar.

    if (currentNumber.length < maxDigits) {
        document
            .getElementById(`num-${currentNumber.length}`)
            .classList.add('blink');
    }

    elements.votoParaText.classList.remove('hidden');

    // Aguarda os dois números.

    if (currentNumber.length !== maxDigits) {
        return;
    }

    elements.instructions.classList.remove('hidden');

    const candidate = candidates[currentNumber];

    if (candidate) {

        // Candidato encontrado.

        elements.candidateInfo.classList.remove('hidden');
        elements.candidatePhoto.classList.remove('hidden');

        elements.candidateName.innerText = candidate.name;
        elements.candidateParty.innerText = candidate.party;
        elements.candidateVice.innerText = candidate.vice;

        elements.photoImg.src = candidate.img;

    } else {

        // Número não cadastrado: voto nulo.

        elements.nullVoteInfo.classList.remove('hidden');
    }
}


/* ========================================
   9. CONFIRMAÇÃO DO VOTO
======================================== */

function confirmVote() {
    if (voteCompleted) return;

    // Só permite confirmar após digitar
    // dois números ou selecionar branco.

    if (currentNumber.length === maxDigits || isBlank) {

        playConfirmSound();

        voteCompleted = true;

        // Mostra a tela final.

        elements.screenContent.classList.add('hidden');
        elements.fimScreen.classList.remove('hidden');

        elements.instructions.classList.add('hidden');

        // Reinicia após quatro segundos.

        clearTimeout(resetTimer);

        resetTimer = setTimeout(() => {

            voteCompleted = false;

            elements.screenContent.classList.remove('hidden');
            elements.fimScreen.classList.add('hidden');

            resetScreen(false);

        }, 4000);
    }
}


/* ========================================
   10. TECLADO DO COMPUTADOR
======================================== */

window.addEventListener('keydown', (e) => {

    // Ignora teclas enquanto o voto está concluído.

    if (voteCompleted) return;

    // Números de 0 a 9.

    if (/^[0-9]$/.test(e.key)) {
        typeNumber(e.key);
    }

    // Corrigir: Backspace ou C.

    else if (
        e.key === 'Backspace' ||
        e.key.toLowerCase() === 'c'
    ) {
        e.preventDefault();
        resetScreen();
    }

    // Confirmar: Enter.

    else if (e.key === 'Enter') {
        e.preventDefault();
        confirmVote();
    }

    // Branco: B.

    else if (e.key.toLowerCase() === 'b') {
        voteBlank();
    }

});
