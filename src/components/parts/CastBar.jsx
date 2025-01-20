import './CastBar.css';

export const CastBar = () => {
    return (
        <div id="cast-bar-container">
            <div id="cast-bar-progress"></div>
        </div>
    );
};

// To control the cast bar, define utility functions in your main game logic file:
// Example:
export function startCast(duration = 1500, onEnd = () => {}) {
    const castBarContainer = document.getElementById('cast-bar-container');
    const castBarProgress = document.getElementById('cast-bar-progress');

    castBarContainer.style.visibility = 'initial';
    castBarProgress.style.transition = `width ${duration}ms linear`;
    castBarProgress.style.width = '100%';

    setTimeout(() => {
        castBarContainer.style.visibility = 'hidden';
        castBarProgress.style.width = '0';
        onEnd();
    }, duration);
}