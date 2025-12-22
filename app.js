import { createIcons, BookOpen, Info, Copy, Check } from 'lucide';
import confetti from 'canvas-confetti';

// Initialize Lucide Icons
createIcons({
    icons: { BookOpen, Info, Copy, Check }
});

document.addEventListener('DOMContentLoaded', async () => {
    // Fetch and display current project context
    try {
        if (window.websim && window.websim.getCurrentProject) {
            const project = await window.websim.getCurrentProject();
            document.getElementById('current-id').textContent = project.id;
            
            // Note: The API returns current_version (the latest). 
            // We display it here to show which project version context we are in.
            document.getElementById('current-version-badge').textContent = `v${project.current_version}`;
        }
    } catch (err) {
        console.error("Context fetch failed:", err);
        document.getElementById('current-id').textContent = "Unknown";
    }

    const copyButtons = document.querySelectorAll('.copy-btn');

    copyButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const codeId = btn.dataset.code;
            const codeElement = document.getElementById(codeId);
            
            if (!codeElement) return;

            const codeText = codeElement.innerText;

            try {
                await navigator.clipboard.writeText(codeText);
                
                // Visual feedback
                const originalContent = btn.innerHTML;
                btn.innerHTML = `<i data-lucide="check"></i> Copied!`;
                btn.classList.add('success');
                createIcons({ icons: { Check } });

                // Confetti for fun
                confetti({
                    particleCount: 40,
                    spread: 50,
                    origin: { y: 0.8 },
                    colors: ['#6366f1', '#10b981'],
                    disableForReducedMotion: true
                });

                setTimeout(() => {
                    btn.innerHTML = originalContent;
                    btn.classList.remove('success');
                    createIcons({ icons: { Copy } });
                }, 2000);

            } catch (err) {
                console.error('Failed to copy text: ', err);
                alert('Could not copy to clipboard.');
            }
        });
    });
});

