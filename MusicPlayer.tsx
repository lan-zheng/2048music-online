import React, { useState, useEffect } from 'react';

interface MusicPlayerProps {
  playOnNewGame: boolean;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ playOnNewGame, onPlayStateChange }) => {
  const baseUrl = 'https://lan-zheng.github.io/2048music-online';
  const audioUrls = [
    { url: `${baseUrl}/music/song1.mp3`, name: '音乐1' },
    { url: `${baseUrl}/music/song2.mp3`, name: '音乐2' },
    { url: `${baseUrl}/music/song3.mp3`, name: '音乐3' },
    { url: `${baseUrl}/music/song4.mp3`, name: '音乐4' },
  ];

  const [currentTrack, setCurrentTrack] = useState(0);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const newAudio = new Audio();
    newAudio.src = audioUrls[currentTrack].url;
    setAudio(newAudio);

    newAudio.onloadeddata = () => {
      console.log('音频加载成功');
      setError(null);
    };

    newAudio.onerror = (e) => {
      console.error('音频加载失败', e);
      setError('音频加载失败');
    };

    return () => {
      newAudio.pause();
      newAudio.src = '';
    };
  }, [currentTrack]);

  useEffect(() => {
    if (playOnNewGame && audio) {
      playMusic();
    }
  }, [playOnNewGame, audio]);

  const playMusic = () => {
    if (audio) {
      audio.play().then(() => {
        console.log('音乐开始播放');
        setIsPlaying(true);
        onPlayStateChange?.(true);
      }).catch(error => {
        console.error("播放失败:", error);
        setError('音频播放失败');
        setIsPlaying(false);
        onPlayStateChange?.(false);
      });
    }
  };

  const pauseMusic = () => {
    if (audio) {
      audio.pause();
      setIsPlaying(false);
      onPlayStateChange?.(false);
    }
  };

  const nextTrack = () => {
    setCurrentTrack((prev) => (prev + 1) % audioUrls.length);
  };

  const prevTrack = () => {
    setCurrentTrack((prev) => (prev - 1 + audioUrls.length) % audioUrls.length);
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2>当前音乐: {audioUrls[currentTrack].name}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ marginTop: '10px' }}>
        <button onClick={isPlaying ? pauseMusic : playMusic} style={{ marginRight: '10px' }}>
          {isPlaying ? '暂停' : '播放'}
        </button>
        <button onClick={prevTrack} style={{ marginRight: '10px' }}>上一首</button>
        <button onClick={nextTrack}>下一首</button>
      </div>
    </div>
  );
};

export default MusicPlayer;