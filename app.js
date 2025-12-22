import { createIcons, BookOpen, Info, Copy, Check } from 'lucide';
import confetti from 'canvas-confetti';

// Initialize Lucide Icons
createIcons({
    icons: { BookOpen, Info, Copy, Check }
});

document.addEventListener('DOMContentLoaded', async () => {
    /**
     * Implements the logic described in the documentation:
     * 1. Detect ID
     * 2. Fetch Detailed Metadata
     * 3. Sync UI
     */
    async function refreshProjectInfo() {
        try {
            if (window.websim && window.websim.getCurrentProject) {
                // 1. Initial Identification (Get Project ID)
                const summary = await window.websim.getCurrentProject();
                
                // 2. Specific Revision Detection (The version in the top-right switcher)
                const viewedVersion = await window.websim.getProjectVersion();
                
                // 3. Detailed Metadata (Optional project info)
                const response = await fetch(`/api/v1/projects/${summary.id}`);
                const projectData = response.ok ? (await response.json()).project : summary;
                
                // Update UI elements
                document.getElementById('current-id').textContent = summary.id;
                document.getElementById('current-version-badge').textContent = `v${viewedVersion || '?'}`;
                
                // Log detailed info for developers
                console.log("Project Context:", {
                    id: summary.id,
                    viewing: viewedVersion,
                    latest: projectData.current_version
                });
            } else {
                // Fallback for non-websim environments (or local preview)
                document.getElementById('current-id').textContent = "Local-Env";
                document.getElementById('current-version-badge').textContent = "v1";
            }
        } catch (err) {
            console.error("Project Detection Error:", err);
            document.getElementById('current-id').textContent = "Error";
            document.getElementById('current-version-badge').textContent = "--";
        }
    }

    // Initial load
    await refreshProjectInfo();

    // 3. Real-time Synchronization (Sync on window focus)
    window.addEventListener('focus', refreshProjectInfo);

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

