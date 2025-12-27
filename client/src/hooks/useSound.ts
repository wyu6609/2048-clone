import { useRef, useCallback, useEffect, useState } from 'react';

interface SoundRefs {
  move: HTMLAudioElement | null;
  merge: HTMLAudioElement | null;
  win: HTMLAudioElement | null;
  gameOver: HTMLAudioElement | null;
}

export function useSound() {
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('2048_muted');
    return saved ? JSON.parse(saved) : false;
  });
  const [isReady, setIsReady] = useState(false);
  const sounds = useRef<SoundRefs>({
    move: null,
    merge: null,
    win: null,
    gameOver: null,
  });

  useEffect(() => {
    sounds.current.move = new Audio('/sounds/hit.mp3');
    sounds.current.merge = new Audio('/sounds/hit.mp3');
    sounds.current.win = new Audio('/sounds/success.mp3');
    sounds.current.gameOver = new Audio('/sounds/hit.mp3');

    sounds.current.move!.volume = 0.2;
    sounds.current.merge!.volume = 0.4;
    sounds.current.win!.volume = 0.6;
    sounds.current.gameOver!.volume = 0.5;

    const loadPromises = Object.values(sounds.current).map(audio => {
      return new Promise<void>((resolve) => {
        if (audio) {
          audio.addEventListener('canplaythrough', () => resolve(), { once: true });
          audio.load();
        } else {
          resolve();
        }
      });
    });

    Promise.all(loadPromises).then(() => setIsReady(true));

    return () => {
      Object.values(sounds.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('2048_muted', JSON.stringify(isMuted));
  }, [isMuted]);

  const playSound = useCallback((type: keyof SoundRefs) => {
    if (isMuted || !isReady) return;
    
    const audio = sounds.current[type];
    if (audio) {
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = audio.volume;
      clone.play().catch(() => {});
    }
  }, [isMuted, isReady]);

  const playMove = useCallback(() => playSound('move'), [playSound]);
  const playMerge = useCallback(() => playSound('merge'), [playSound]);
  const playWin = useCallback(() => playSound('win'), [playSound]);
  const playGameOver = useCallback(() => playSound('gameOver'), [playSound]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev: boolean) => !prev);
  }, []);

  return {
    isMuted,
    toggleMute,
    playMove,
    playMerge,
    playWin,
    playGameOver,
    isReady,
  };
}
