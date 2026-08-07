export const playNotificationSound = () => {
    try {
        const audio = new Audio('/notification.mp3'); // We'll need a way to have a sound, or use a data URI
        audio.play().catch(e => console.error("Audio play failed:", e));
    } catch (err) {
        console.error("Audio error", err);
    }
}
