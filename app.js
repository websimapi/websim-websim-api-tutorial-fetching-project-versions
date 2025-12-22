import { createIcons, BookOpen, Info, Copy, Check, Play, GitBranch, RefreshCw, ChevronRight } from 'lucide';
import confetti from 'canvas-confetti';

// Initialize Lucide Icons
createIcons({
    icons: { BookOpen, Info, Copy, Check, Play, GitBranch, RefreshCw, ChevronRight }
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
                // 1. Fetch Context & Creator in parallel
                const [summary, creator] = await Promise.all([
                    window.websim.getCurrentProject(),
                    window.websim.getCreator()
                ]);
                
                // 2. Detailed Metadata
                const response = await fetch(`/api/v1/projects/${summary.id}`);
                if (!response.ok) throw new Error("Metadata fetch failed");
                
                const { project } = await response.json();
                
                // Update UI elements
                document.getElementById('current-id').textContent = project.id;
                document.getElementById('current-creator').textContent = creator.username;

                // Priority: Use the version from the context (summary.version)
                // This ensures we show the version we are ON, not just the latest one (project.current_version)
                let activeVersion = summary.version;
                let isExact = true;

                if (activeVersion === undefined || activeVersion === null) {
                    activeVersion = project.current_version;
                    isExact = false;
                }

                const badge = document.getElementById('current-version-badge');
                badge.textContent = `v${activeVersion}${isExact ? '' : ' (Latest)'}`;
                
                if (isExact) {
                    badge.classList.add('exact-match');
                    badge.title = "Exact version detected from context";
                } else {
                    badge.classList.remove('exact-match');
                    badge.title = "Defaulting to latest version (context version undefined)";
                }
                
                // Log detailed info for developers
                console.log("Project Detected:", project.title);
                console.log("Created By:", creator.username);
                console.log("Active Version:", activeVersion, "Exact Match:", isExact);
            } else {
                // Fallback for non-websim environments (or local preview)
                document.getElementById('current-id').textContent = "Local-Env";
                document.getElementById('current-version-badge').textContent = "v1";
                document.getElementById('current-creator').textContent = "LocalUser";
            }
        } catch (err) {
            console.error("Project Detection Error:", err);
            document.getElementById('current-id').textContent = "Error";
            document.getElementById('current-version-badge').textContent = "--";
        }
    }

    // Initial load
    await refreshProjectInfo();

    // --- Interactive Testing Logic ---

    // 1. Project Detection Test
    const btnRunDetect = document.getElementById('btn-run-detect');
    const resultDetect = document.getElementById('result-detect');
    
    btnRunDetect.addEventListener('click', async () => {
        resultDetect.classList.remove('hidden');
        const content = resultDetect.querySelector('.result-content');
        content.textContent = "Gathering Debug Info...";
        
        const debugInfo = {
            timestamp: new Date().toISOString(),
            environment: {
                href: window.location.href,
                referrer: document.referrer
            },
            websim: {
                available: !!window.websim,
                methods: window.websim ? Object.keys(window.websim) : []
            }
        };

        try {
            if (window.websim && window.websim.getCurrentProject) {
                const summary = await window.websim.getCurrentProject();
                const creator = await window.websim.getCreator();
                
                debugInfo.context = summary;
                debugInfo.creator = creator;
                debugInfo.contextVersionType = typeof summary.version;

                if (summary.id) {
                    const response = await fetch(`/api/v1/projects/${summary.id}`);
                    const data = await response.json();
                    debugInfo.apiProject = {
                        id: data.project.id,
                        current_version: data.project.current_version,
                        title: data.project.title,
                        created_by_id: data.project.created_by_id
                    };
                    
                    debugInfo.logicCheck = {
                        contextVersion: summary.version,
                        latestVersion: data.project.current_version,
                        isMatch: summary.version == data.project.current_version,
                        conclusion: (summary.version != null) ? "Specific Version Detected" : "Falling back to Latest (Context is Null)"
                    };
                }
            } else {
                debugInfo.error = "window.websim.getCurrentProject not found";
            }
            
            content.textContent = JSON.stringify(debugInfo, null, 2);
            triggerSuccessFeedback(btnRunDetect);
        } catch (err) {
            debugInfo.exception = err.message;
            debugInfo.stack = err.stack;
            content.textContent = JSON.stringify(debugInfo, null, 2);
        }
    });

    // 2. Ancestry Trace Test
    const btnRunAncestry = document.getElementById('btn-run-ancestry');
    const resultAncestry = document.getElementById('result-ancestry');

    btnRunAncestry.addEventListener('click', async () => {
        resultAncestry.classList.remove('hidden');
        const visual = resultAncestry.querySelector('.ancestry-visual');
        visual.innerHTML = "Tracing...";

        try {
            const summary = await window.websim.getCurrentProject();
            const projectId = summary.id;
            const currentVersion = summary.version;

            const res = await fetch(`/api/v1/projects/${projectId}/revisions`);
            const { revisions } = await res.json();
            
            const parentMap = new Map();
            revisions.data.forEach(rev => {
                parentMap.set(rev.project_revision.version, rev.project_revision.parent_revision_version);
            });

            const path = [];
            let cursor = currentVersion;
            while (cursor) {
                path.push(cursor);
                cursor = parentMap.get(cursor);
            }

            visual.innerHTML = path.map((v, i) => `
                <span class="ancestry-node ${v === currentVersion ? 'active' : ''}">v${v}</span>
                ${i < path.length - 1 ? '<i data-lucide="chevron-right" class="ancestry-arrow"></i>' : ''}
            `).join('');
            
            createIcons({ icons: { ChevronRight } });
            triggerSuccessFeedback(btnRunAncestry);
        } catch (err) {
            visual.textContent = "Error: " + err.message;
        }
    });

    // 3. Sync Test
    const btnRunSync = document.getElementById('btn-run-sync');
    const resultSync = document.getElementById('result-sync');
    const syncLogs = resultSync.querySelector('.log-list');

    async function performSync(source) {
        resultSync.classList.remove('hidden');
        const time = new Date().toLocaleTimeString();
        const logItem = document.createElement('div');
        logItem.className = 'log-item';
        logItem.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-msg">Sync triggered by <strong>${source}</strong></span>`;
        syncLogs.prepend(logItem);
        
        await refreshProjectInfo();
    }

    btnRunSync.addEventListener('click', () => {
        performSync('Button Click');
        triggerSuccessFeedback(btnRunSync);
    });

    // 3. Real-time Synchronization (Sync on window focus)
    window.addEventListener('focus', () => performSync('Window Focus'));

    function triggerSuccessFeedback(btn) {
        confetti({
            particleCount: 20,
            spread: 30,
            origin: { y: 0.9 },
            colors: ['#6366f1', '#10b981'],
            disableForReducedMotion: true
        });
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

