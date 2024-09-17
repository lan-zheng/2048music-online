const gameBoard = document.getElementById('game-board');
const newGameButton = document.getElementById('new-game');
const scoreElement = document.getElementById('score');
const bestScoreElement = document.getElementById('best-score');
const bgm = document.getElementById('bgm');
const toggleAudioButton = document.getElementById('toggle-audio');
let board = [];
let score = 0;
let bestScore = localStorage.getItem('bestScore') || 0;
let startX, startY;
let isMuted = false;
let audioLoaded = false;
let currentMusicIndex = 0;

const defaultMusicList = [
    { name: "江楠-不属于地球上的.mp3", url: "music/江楠-不属于地球上的.mp3" },
    { name: "玫瑰少年-蔡依林.mp3", url: "music/玫瑰少年-蔡依林.mp3" },
    { name: "五号天九号球.mp3", url: "music/五号天九号球.mp3" },
    { name: "周传雄青花.mp3", url: "music/周传雄青花.mp3" }
];

let musicList = JSON.parse(localStorage.getItem('musicList')) || defaultMusicList;

let currentUser = null;
let users = JSON.parse(localStorage.getItem('users')) || {};

function showLoginModal() {
    document.getElementById('login-modal').style.display = 'block';
}

function showRegisterModal() {
    document.getElementById('register-modal').style.display = 'block';
}

function loginUser() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (username && password) {
        if (users[username] && users[username].password === password) {
            currentUser = username;
            document.getElementById('current-user').textContent = `当前用户: ${username}`;
            document.getElementById('login-modal').style.display = 'none';
            updateBestScore();
            alert("登录成功！");
        } else {
            alert("用户名或密码错误！");
        }
    } else {
        alert('请输入用户名和密码');
    }
}

function registerUser() {
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;

    if (username && password) {
        if (users[username]) {
            alert("用户名已存在！");
        } else {
            users[username] = { password: password, bestScore: 0 };
            localStorage.setItem('users', JSON.stringify(users));
            document.getElementById('register-modal').style.display = 'none';
            alert("注册成功！请登录。");
        }
    } else {
        alert('请输入用户名和密码');
    }
}

let playedMusicIndices = []; // 用于存储已播放的音乐索引

function updateBestScore() {
    if (currentUser) {
        bestScore = users[currentUser].bestScore;
        bestScoreElement.textContent = bestScore;
    }
}

function showLeaderboard() {
    const leaderboardModal = document.getElementById('leaderboard-modal');
    const leaderboardTable = document.getElementById('leaderboard-table').getElementsByTagName('tbody')[0];
    leaderboardTable.innerHTML = '';

    const sortedUsers = Object.entries(users).sort((a, b) => b[1].bestScore - a[1].bestScore);
    sortedUsers.forEach((user, index) => {
        const row = leaderboardTable.insertRow();
        row.insertCell(0).textContent = index + 1;
        row.insertCell(1).textContent = user[0];
        row.insertCell(2).textContent = user[1].bestScore;
    });

    leaderboardModal.style.display = 'block';
}

function checkAudioSupport() {
    const audio = document.createElement('audio');
    return typeof audio.canPlayType === 'function' && audio.canPlayType('audio/mpeg') !== '';
}

function setupAudioEventHandlers() {
    bgm.onerror = () => {
        console.error(`无法加载音乐: ${bgm.src}`);
        playNextMusic(); // 尝试播放下一首音乐
    };

    bgm.oncanplaythrough = () => {
        if (!isMuted) {
            playAudio();
        }
    };

    bgm.onended = () => {
        playNextMusic(); // 播放下一首音乐
    };
}

function playMusic(index) {
    const music = musicList[index];
    console.log("Attempting to play:", music.name);
    bgm.src = music.url;

    bgm.onerror = () => {
        console.error(`无法加载音乐: ${music.name}`);
        // 从列表中移除无法播放的音乐
        musicList = musicList.filter((_, i) => i !== index);
        localStorage.setItem('musicList', JSON.stringify(musicList));
        updateMusicList();
        playNextMusic();
    };

    bgm.oncanplaythrough = () => {
        console.log("Can play through:", music.name);
        if (!isMuted) {
            playAudio();
        }
    };

    bgm.load();
    document.getElementById('music-list').value = index;
}

function playRandomMusic() {
    if (musicList.length > 0) {
        if (playedMusicIndices.length === musicList.length) {
            playedMusicIndices = [];
        }

        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * musicList.length);
        } while (playedMusicIndices.includes(randomIndex));

        playedMusicIndices.push(randomIndex);
        const music = musicList[randomIndex];
        console.log("Playing:", music.name);
        bgm.src = music.url;
        bgm.load(); // 确保重新加载音频
        document.getElementById('music-list').value = randomIndex;
    }
}

function playNextMusic() {
    if (musicList.length > 0) {
        currentMusicIndex = (currentMusicIndex + 1) % musicList.length; // 循环播放
        playMusic(currentMusicIndex);
    }
}

function initializeAudio() {
    if (!checkAudioSupport()) {
        console.warn('此浏览器不支持 MP3 音频播放。');
        toggleAudioButton.textContent = '音乐不可用';
        toggleAudioButton.disabled = true;
        return;
    }

    // 清理本地存储中的音乐列表
    localStorage.removeItem('musicList');
    
    // 使用 Set 去重
    musicList = Array.from(new Set(defaultMusicList.map(JSON.stringify))).map(JSON.parse);

    // 保存更新后的音乐列表
    localStorage.setItem('musicList', JSON.stringify(musicList));

    updateMusicList();
    
    bgm.addEventListener('canplaythrough', () => {
        console.log('Audio can play through');
        audioLoaded = true;
        toggleAudioButton.disabled = false;
        updateAudioButtonText();
        if (!isMuted) {
            playAudio();
        }
    });

    bgm.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        toggleAudioButton.textContent = '音乐不可用';
        toggleAudioButton.disabled = true;
    });

    playRandomMusic();
}

function updateMusicList() {
    const musicListSelect = document.getElementById('music-list');
    musicListSelect.innerHTML = '';
    musicList.forEach((music, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = music.name;
        musicListSelect.appendChild(option);
    });
}

function playAudio() {
    if (bgm.readyState >= 2 && !isMuted) {
        bgm.play().catch(e => {
            console.error("音频播放失败:", e);
            updateAudioButtonText();
        });
    }
}

function updateAudioButtonText() {
    toggleAudioButton.textContent = isMuted ? '音乐开' : '音乐关';
}

function toggleAudio() {
    isMuted = !isMuted;
    if (isMuted) {
        bgm.pause();
    } else {
        playAudio();
    }
    updateAudioButtonText();
}

// 在全局作用域添加
let previousBoard = [];

function initializeGame() {
    board = Array(4).fill().map(() => Array(4).fill(0));
    previousBoard = Array(4).fill().map(() => Array(4).fill(0)); // 初始化 previousBoard
    score = 0;
    updateScore();
    addNewTile();
    addNewTile();
    renderBoard();

    // 每次新游戏开始时播放随机音乐
    playRandomMusic();

    if (audioLoaded) {
        updateAudioButtonText();
        if (!isMuted) {
            playAudio();
        }
    }

    if (currentUser) {
        localStorage.setItem('lastUser', currentUser);
    }
}

function addNewTile() {
    const emptyTiles = [];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (board[i][j] === 0) {
                emptyTiles.push({i, j});
            }
        }
    }
    if (emptyTiles.length > 0) {
        const {i, j} = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
        board[i][j] = Math.random() < 0.9 ? 2 : 4;
    }
}

function renderBoard() {
    gameBoard.innerHTML = '';
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            if (board[i][j] !== 0) {
                tile.textContent = board[i][j];
                tile.classList.add(`tile-${board[i][j]}`);
                
                if (board[i][j] !== previousBoard[i][j]) {
                    if (previousBoard[i][j] !== 0 && board[i][j] > previousBoard[i][j]) {
                        // 合并情况
                        tile.classList.add('tile-merged', 'tile-highlight');
                    } else if (previousBoard[i][j] === 0) {
                        // 新方块
                        tile.classList.add('tile-new');
                    }
                    
                    setTimeout(() => {
                        tile.classList.remove('tile-merged', 'tile-new', 'tile-highlight');
                    }, 300);
                }
            }
            gameBoard.appendChild(tile);
        }
    }
}

function updateScore() {
    scoreElement.textContent = score;
    if (currentUser && score > users[currentUser].bestScore) {
        users[currentUser].bestScore = score;
        bestScore = score;
        localStorage.setItem('users', JSON.stringify(users));
    }
    bestScoreElement.textContent = bestScore;
}

function move(direction) {
    let moved = false;
    const newBoard = JSON.parse(JSON.stringify(board));
    const mergedPositions = []; // 新增：跟踪合并位置

    function moveAndMerge(line) {
        let newLine = line.filter(cell => cell !== 0);
        for (let i = 0; i < newLine.length - 1; i++) {
            if (newLine[i] === newLine[i + 1]) {
                newLine[i] *= 2;
                score += newLine[i];
                newLine[i + 1] = 0;
                mergedPositions.push(i); // 新增：记录合并位置
                i++;
            }
        }
        newLine = newLine.filter(cell => cell !== 0);
        while (newLine.length < 4) {
            newLine.push(0);
        }
        return newLine;
    }

    if (direction === 'left') {
        for (let i = 0; i < 4; i++) {
            const newRow = moveAndMerge(newBoard[i]);
            if (!moved && newRow.some((cell, index) => cell !== newBoard[i][index])) {
                moved = true;
            }
            newBoard[i] = newRow;
        }
    } else if (direction === 'right') {
        for (let i = 0; i < 4; i++) {
            const newRow = moveAndMerge(newBoard[i].reverse()).reverse();
            if (!moved && newRow.some((cell, index) => cell !== newBoard[i][index])) {
                moved = true;
            }
            newBoard[i] = newRow;
        }
    } else if (direction === 'up') {
        for (let j = 0; j < 4; j++) {
            const column = [newBoard[0][j], newBoard[1][j], newBoard[2][j], newBoard[3][j]];
            const newColumn = moveAndMerge(column);
            if (!moved && newColumn.some((cell, index) => cell !== column[index])) {
                moved = true;
            }
            for (let i = 0; i < 4; i++) {
                newBoard[i][j] = newColumn[i];
            }
        }
    } else if (direction === 'down') {
        for (let j = 0; j < 4; j++) {
            const column = [newBoard[3][j], newBoard[2][j], newBoard[1][j], newBoard[0][j]];
            const newColumn = moveAndMerge(column);
            if (!moved && newColumn.some((cell, index) => cell !== column[index])) {
                moved = true;
            }
            for (let i = 0; i < 4; i++) {
                newBoard[3-i][j] = newColumn[i];
            }
        }
    }

    if (moved) {
        previousBoard = JSON.parse(JSON.stringify(board));
        board = newBoard;
        updateScore();
        addNewTile();
        renderBoard();
        
        // 在下一帧更新 previousBoard，以便正确触发新方块的动画
        requestAnimationFrame(() => {
            previousBoard = JSON.parse(JSON.stringify(board));
        });

        if (isGameOver()) {
            setTimeout(() => {
                showGameOverModal('游戏结束');
            }, 300);
        } else if (hasWon()) {
            setTimeout(() => {
                showGameOverModal('恭喜你过关');
            }, 300);
        }
    }
}

function isGameOver() {
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (board[i][j] === 0) {
                return false;
            }
            if (j < 3 && board[i][j] === board[i][j + 1]) {
                return false;
            }
            if (i < 3 && board[i][j] === board[i + 1][j]) {
                return false;
            }
        }
    }
    return true;
}

function hasWon() {
    if (board.some(row => row.includes(2048))) {
        alert('恭喜你达到了2048！游戏将继续，看看你能达到多高的分数。');
        return false;
    }
    return false;
}

function showGameOverModal(message) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>${message}</h2>
            <p>您的得分是：${score}</p>
            <button id="restart-game">重新开始</button>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('restart-game').addEventListener('click', () => {
        document.body.removeChild(modal);
        initializeGame();
    });
}

function handleKeyDown(e) {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const direction = e.key.toLowerCase().replace('arrow', '');
        move(direction);
    }
}

function handleTouchStart(e) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
}

function handleTouchEnd(e) {
    const diffX = e.changedTouches[0].clientX - startX;
    const diffY = e.changedTouches[0].clientY - startY;
    const threshold = 50;

    if (Math.abs(diffX) > threshold || Math.abs(diffY) > threshold) {
        if (Math.abs(diffX) > Math.abs(diffY)) {
            move(diffX > 0 ? 'right' : 'left');
        } else {
            move(diffY > 0 ? 'down' : 'up');
        }
    }
}

const musicListSelect = document.getElementById('music-list');

musicListSelect.addEventListener('change', (e) => {
    const selectedIndex = e.target.value;
    playMusic(selectedIndex);
});

document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('keydown', handleKeyDown);
    gameBoard.addEventListener('touchstart', handleTouchStart, { passive: true });
    gameBoard.addEventListener('touchend', handleTouchEnd, { passive: true });
    newGameButton.addEventListener('click', () => {
        initializeGame();
    });

    toggleAudioButton.addEventListener('click', toggleAudio);

    const loginButton = document.getElementById('login-button');
    if (loginButton) {
        loginButton.addEventListener('click', showLoginModal);
    } else {
        console.error('Login button not found');
    }

    const registerButton = document.getElementById('register-button');
    if (registerButton) {
        registerButton.addEventListener('click', showRegisterModal);
    } else {
        console.error('Register button not found');
    }

    const confirmLoginButton = document.getElementById('confirm-login');
    if (confirmLoginButton) {
        confirmLoginButton.addEventListener('click', loginUser);
    } else {
        console.error('Confirm login button not found');
    }

    const confirmRegisterButton = document.getElementById('confirm-register');
    if (confirmRegisterButton) {
        confirmRegisterButton.addEventListener('click', registerUser);
    } else {
        console.error('Confirm register button not found');
    }

    const closeLoginButton = document.getElementById('close-login');
    if (closeLoginButton) {
        closeLoginButton.addEventListener('click', () => {
            document.getElementById('login-modal').style.display = 'none';
        });
    } else {
        console.error('Close login button not found');
    }

    const closeRegisterButton = document.getElementById('close-register');
    if (closeRegisterButton) {
        closeRegisterButton.addEventListener('click', () => {
            document.getElementById('register-modal').style.display = 'none';
        });
    } else {
        console.error('Close register button not found');
    }

    const showLeaderboardButton = document.getElementById('show-leaderboard');
    if (showLeaderboardButton) {
        showLeaderboardButton.addEventListener('click', showLeaderboard);
    } else {
        console.error('Show leaderboard button not found');
    }

    const closeLeaderboardButton = document.getElementById('close-leaderboard');
    if (closeLeaderboardButton) {
        closeLeaderboardButton.addEventListener('click', () => {
            document.getElementById('leaderboard-modal').style.display = 'none';
        });
    } else {
        console.error('Close leaderboard button not found');
    }

    // 如果之前有登录的用户，自动登录
    const lastUser = localStorage.getItem('lastUser');
    if (lastUser && users[lastUser]) {
        currentUser = lastUser;
        document.getElementById('current-user').textContent = `当前用户: ${currentUser}`;
        updateBestScore();
    }

    initializeAudio();
    initializeGame();

    // 添加这个事件监听器来处理浏览器的自动播放限制
    document.body.addEventListener('click', function bodyClick() {
        playAudio();
        document.body.removeEventListener('click', bodyClick);
    }, { once: true });
});

toggleAudioButton.textContent = isMuted ? '音乐开' : '音乐关';