// Register Resize Module
Quill.register('modules/blotFormatter', QuillBlotFormatter.default);

// Custom Figure Module (Image with Caption)
const BlockEmbed = Quill.import('blots/block/embed');

class FigureBlot extends BlockEmbed {
    static create(value) {
        let node = super.create();
        node.setAttribute('contenteditable', 'false');
        
        const isVideo = value.type === 'video';
        let media; // This will vary, but for video it's the wrapper for the figure to hold. 
                   // BUT for blotFormatter, we want to return the "driver" image so it attaches there?
                   // Actually FigureBlot returns the 'node' (figure). 
                   // BlotFormatter finds the image inside the figure?
                   // No, BlotFormatter works on the element you click.
        
        let driver = null; 

        if (isVideo) {
            const wrapper = document.createElement('div');
            wrapper.className = 'video-wrapper';
            
            // Driver: Transparent Image that holds dimensions and receives clicks
            driver = document.createElement('img');
            driver.className = 'video-driver';
            driver.setAttribute('src', 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PC9zdmc+');
            
            const iframe = document.createElement('iframe');
            iframe.setAttribute('src', value.url);
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('allowfullscreen', 'true');
            
            wrapper.appendChild(driver);
            wrapper.appendChild(iframe);
            media = wrapper;
        } else {
            media = document.createElement('img');
            media.setAttribute('src', value.url);
            driver = media; // The image itself is the driver
        }
        media.setAttribute('contenteditable', 'false'); // Wrapper shouldn't be editable
        if (driver !== media) driver.setAttribute('contenteditable', 'false');

        // Restore attributes to the DRIVER (the thing getting resized)
        if (value.width) driver.setAttribute('width', value.width);
        if (value.height) driver.setAttribute('height', value.height);
        if (value.style) driver.setAttribute('style', value.style);
        
        // Also apply to iframe directly during creation for video
        if (isVideo) {
            const iframe = media.querySelector('iframe');
            if (iframe) {
                if (value.width) iframe.setAttribute('width', value.width);
                if (value.height) iframe.setAttribute('height', value.height);
                if (value.style) iframe.setAttribute('style', value.style);
            }
        }
        
        const figcaption = document.createElement('figcaption');
        figcaption.setAttribute('contenteditable', 'true');
        figcaption.innerText = value.caption || '';
        
        // Prevent Quill from hijacking clicks inside the caption
        figcaption.addEventListener('mousedown', (e) => e.stopPropagation());

        node.appendChild(media);
        node.appendChild(figcaption);

        // Observer to sync inner image alignment (from resize/overlay tools) to outer figure
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                // Check for alignment/style changes on driver
                const target = driver; 
                const s = target.style;
                const parent = node; // The figure element

                // Sync size/style to iframe for persistence
                if (isVideo) {
                    const iframe = media.querySelector('iframe');
                    if (iframe) {
                        if (s.width) iframe.style.width = s.width;
                        if (s.height) iframe.style.height = s.height;
                        // Do NOT copy full cssText as it overwrites position: absolute from CSS class
                        if (target.hasAttribute('width')) iframe.setAttribute('width', target.getAttribute('width'));
                        if (target.hasAttribute('height')) iframe.setAttribute('height', target.getAttribute('height'));
                    }
                }

                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    // Check for alignment signals from overlay tools
                    if (s.float === 'left') {
                        s.float = ''; // Remove inline float
                        parent.classList.remove('ql-align-center', 'ql-align-right');
                        parent.classList.add('ql-align-left');
                        parent.setAttribute('data-align', 'left');
                        requestAnimationFrame(() => {
                             if (window.quill) window.quill.getModule('blotFormatter').update();
                        });
                    } else if (s.float === 'right') {
                        s.float = ''; 
                        parent.classList.remove('ql-align-center', 'ql-align-left');
                        parent.classList.add('ql-align-right');
                        parent.setAttribute('data-align', 'right');
                        requestAnimationFrame(() => {
                             if (window.quill) window.quill.getModule('blotFormatter').update();
                        });
                    } else if (s.margin === 'auto' || s.display === 'block') {
                         // Often used for center
                        if (s.marginLeft === 'auto' && s.marginRight === 'auto') {
                            s.marginLeft = '';
                            s.marginRight = '';
                            s.display = ''; 
                            parent.classList.remove('ql-align-left', 'ql-align-right');
                            parent.classList.add('ql-align-center');
                            parent.setAttribute('data-align', 'center');
                            requestAnimationFrame(() => {
                                 if (window.quill) window.quill.getModule('blotFormatter').update();
                            });
                        }
                    }
                }
            });
        });
        
        // Observe the driver (image or transparent image)
        // Must watch 'width' and 'height' attributes because blotFormatter might toggle them
        observer.observe(driver, { attributes: true, attributeFilter: ['style', 'width', 'height'] });

        return node;
    }

    static value(node) {
        const img = node.querySelector('img:not(.video-driver)');
        const iframe = node.querySelector('iframe');
        const figcaption = node.querySelector('figcaption');
        
        let url = '';
        if (iframe) {
             url = iframe.getAttribute('src');
        } else if (img) {
             url = img.getAttribute('src');
        }

        // Return dimensions from the iframe if it exists, otherwise the image
        const target = iframe || img; 

        return {
            url: url,
            type: iframe ? 'video' : 'image',
            caption: figcaption ? figcaption.innerText : '',
            width: target ? target.getAttribute('width') : null,
            height: target ? target.getAttribute('height') : null,
            style: target ? target.getAttribute('style') : null
        };
    }

    format(name, value) {
        if (name === 'align') {
            // Remove existing alignment classes
            this.domNode.classList.remove('ql-align-left', 'ql-align-center', 'ql-align-right');
            if (value) {
                this.domNode.setAttribute('data-align', value);
                this.domNode.classList.add(`ql-align-${value}`);
            } else {
                this.domNode.removeAttribute('data-align');
            }
        } else {
            super.format(name, value);
        }
    }
}
FigureBlot.blotName = 'figure';
FigureBlot.tagName = 'figure';
Quill.register(FigureBlot);

// Custom Cite Module for Quill
const Inline = Quill.import('blots/inline');
class CitationBlot extends Inline {
    static create(value) {
        let node = super.create();
        node.setAttribute('data-cite', value);
        node.setAttribute('class', 'citation');
        node.setAttribute('title', `Citation: ${value}`);
        return node;
    }

    static formats(node) {
        return node.getAttribute('data-cite');
    }
}
CitationBlot.blotName = 'citation';
CitationBlot.tagName = 'span';
Quill.register(CitationBlot);

// Initialize Quill Editor
const quill = new Quill('#editor-container', {
    theme: 'snow',
    modules: {
        blotFormatter: {}, // Enable resizing
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline'],
                ['link', 'blockquote', 'code-block'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                [{ 'align': [] }],
                ['image', 'video'],
                ['cite', 'figure'], // Added Cite and Figure buttons
                ['clean']
            ],
            handlers: {
                'cite': function () {
                    const range = this.quill.getSelection();
                    if (range) {
                        showCiteModal(range);
                    }
                },
                'figure': function() {
                    const range = this.quill.getSelection(true);
                    if (!range) return;

                    try {
                        let targetBlot = null;
                        
                        const isMedia = (blot) => {
                            if (!blot || !blot.domNode) return false;
                            const tag = (blot.domNode.tagName || "").toUpperCase();
                            return tag === 'IMG' || tag === 'IFRAME';
                        };

                        // helper to check index
                        const checkIdx = (idx) => {
                            if (idx < 0) return null;
                            const [leaf] = this.quill.getLeaf(idx);
                            if (isMedia(leaf)) return leaf;
                            
                            // Fallback: Check if the leaf's parent or children matches
                            // (Useful if blotFormatter has wrapped the node)
                            if (leaf && leaf.domNode) {
                                if (isMedia({domNode: leaf.domNode})) return leaf;
                                // Deep check - only if it's an Element node
                                if (leaf.domNode.nodeType === 1) { 
                                    const img = leaf.domNode.querySelector('img, iframe');
                                    if (img) return { domNode: img, ...leaf };
                                }
                            }
                            return null;
                        };

                        // 1. Check surrounding indices
                        targetBlot = checkIdx(range.index) || checkIdx(range.index - 1) || checkIdx(range.index + 1);

                        // 2. Scan selection range
                        if (!targetBlot && range.length > 0) {
                            for (let i = 0; i <= range.length; i++) {
                                const l = checkIdx(range.index + i);
                                if (l) {
                                    targetBlot = l;
                                    break;
                                }
                            }
                        }

                        if (targetBlot) {
                            const dom = targetBlot.domNode;
                            const url = dom.getAttribute('src');
                            const type = dom.tagName.toUpperCase() === 'IFRAME' ? 'video' : 'image';
                            const index = this.quill.getIndex(targetBlot);

                            console.log("Figure: Found media", type, "at", index);

                            // Perform the swap
                            this.quill.deleteText(index, 1);
                            this.quill.insertEmbed(index, 'figure', {
                                url: url,
                                type: type,
                                caption: ''
                            });

                            // Select the caption
                            setTimeout(() => {
                                let figHtml = this.quill.root.querySelectorAll('figure');
                                let targetFig = null;
                                for (let fig of figHtml) {
                                    let blot = Quill.find(fig);
                                    if (blot && this.quill.getIndex(blot) >= index - 2) {
                                        targetFig = fig;
                                        break;
                                    }
                                }

                                if (targetFig) {
                                    const caption = targetFig.querySelector('figcaption');
                                    if (caption) {
                                        caption.focus();
                                        const r = document.createRange();
                                        const s = window.getSelection();
                                        r.selectNodeContents(caption);
                                        r.collapse(false);
                                        s.removeAllRanges();
                                        s.addRange(r);
                                    }
                                }
                            }, 150);
                        } else {
                            alert("Please click ON the image or video first, then click the toolbar button.");
                        }
                    } catch (err) {
                        console.error("Figure Error:", err);
                        alert("Error: " + err.message);
                    }
                }
            }
        }
    }
});
window.quill = quill; // Make globally accessible for helpers

// Citation Modal Logic
const citeModal = document.getElementById('cite-modal');
const citeList = document.getElementById('cite-list');
const citeSearch = document.getElementById('cite-search');
const closeCiteBtn = document.getElementById('close-cite-modal');
const bibtexTextarea = document.getElementById('bibtex');
let currentRange = null;
let allCiteKeys = [];
let filteredKeys = [];
let selectedIndex = 0;

function showCiteModal(range) {
    currentRange = range;
    const bibtex = bibtexTextarea.value;
    allCiteKeys = extractBibtexKeys(bibtex);
    filteredKeys = allCiteKeys;
    selectedIndex = 0;
    
    citeSearch.value = '';
    renderCiteList(filteredKeys);
    
    citeModal.classList.remove('hidden');
    setTimeout(() => citeSearch.focus(), 50);
}

function renderCiteList(keys) {
    citeList.innerHTML = '';
    
    if (keys.length === 0) {
        citeList.innerHTML = `<div class="cite-empty">${allCiteKeys.length === 0 ? 'No BibTeX keys found.' : 'No matches found.'}</div>`;
    } else {
        keys.forEach((key, index) => {
            const item = document.createElement('div');
            item.className = 'cite-item' + (index === selectedIndex ? ' active' : '');
            item.textContent = key;
            item.onclick = () => selectKey(key);
            citeList.appendChild(item);
            
            // Scroll selected item into view if needed
            if (index === selectedIndex) {
                item.scrollIntoView({ block: 'nearest' });
            }
        });
    }
}

function selectKey(key) {
    quill.focus();
    if (currentRange.length === 0) {
        quill.insertText(currentRange.index, key, 'citation', key);
        quill.insertText(currentRange.index + key.length, ' ', 'citation', false);
        quill.setSelection(currentRange.index + key.length + 1);
    } else {
        quill.formatText(currentRange.index, currentRange.length, 'citation', key);
        quill.setSelection(currentRange.index + currentRange.length);
    }
    quill.format('citation', false);
    hideCiteModal();
}

citeSearch.oninput = (e) => {
    const query = e.target.value.toLowerCase();
    filteredKeys = allCiteKeys.filter(key => key.toLowerCase().includes(query));
    selectedIndex = 0;
    renderCiteList(filteredKeys);
};

citeSearch.onkeydown = (e) => {
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % filteredKeys.length;
        renderCiteList(filteredKeys);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = (selectedIndex - 1 + filteredKeys.length) % filteredKeys.length;
        renderCiteList(filteredKeys);
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredKeys[selectedIndex]) {
            selectKey(filteredKeys[selectedIndex]);
        }
    } else if (e.key === 'Escape') {
        hideCiteModal();
    }
};

function hideCiteModal() {
    citeModal.classList.add('hidden');
    currentRange = null;
}

function extractBibtexKeys(bibtex) {
    const keys = [];
    const regex = /@\w+\s*{\s*([^,]+)/g;
    let match;
    while ((match = regex.exec(bibtex)) !== null) {
        keys.push(match[1].trim());
    }
    return [...new Set(keys)].sort(); // Unique and sorted
}

closeCiteBtn.onclick = hideCiteModal;
window.onclick = (event) => {
    if (event.target == citeModal) hideCiteModal();
};

// Add custom icon for Cite button
const citeIcon = '<svg viewBox="0 0 18 18"><path class="ql-stroke" d="M11,4c-2.2,0-4,1.8-4,4s1.8,4,4,4s4-1.8,4-4S13.2,4,11,4z M11,10c-1.1,0-2-0.9-2-2s0.9-2,2-2s2,0.9,2,2S12.1,10,11,10z"/><path class="ql-fill" d="M5,14H3v-2h2V14z M8,14H6v-2h2V14z M11,14H9v-2h2V14z M14,14h-2v-2h2V14z"/></svg>';
const citeBtn = document.querySelector('.ql-cite');
if (citeBtn) citeBtn.innerHTML = citeIcon;

// Add custom icon for Figure button
const figureIcon = '<svg viewBox="0 0 18 18"><rect class="ql-stroke" height="10" width="12" x="3" y="4"></rect><line class="ql-stroke" x1="5" x2="13" y1="11" y2="11"></line><line class="ql-stroke" x1="5" x2="10" y1="8" y2="8"></line></svg>';
// Small delay to ensure toolbar is rendered
setTimeout(() => {
    const figureBtn = document.querySelector('.ql-figure');
    if (figureBtn) figureBtn.innerHTML = figureIcon;
}, 100);

const postForm = document.getElementById('post-form');
const outputSection = document.getElementById('output-section');
const previewBtn = document.getElementById('preview-btn');
const importBtn = document.getElementById('import-btn');
const importInput = document.getElementById('import-input');

// Import Article Logic
importBtn.addEventListener('click', () => importInput.click());

importInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const html = event.target.result;
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Extract Title
        const titleTag = doc.querySelector('title');
        let title = "";
        if (titleTag) {
            title = titleTag.textContent.replace('BITSTREAM - ', '').trim();
        }

        // Extract Description
        const descTag = doc.querySelector('meta[name="description"]');
        const description = descTag ? descTag.getAttribute('content') : "";

        // Extract Date
        const timeTag = doc.querySelector('time[itemprop="datePublished"]');
        const date = timeTag ? timeTag.getAttribute('datetime') : "";

        // Extract Content
        const contentDiv = doc.querySelector('[itemprop="articleBody"]');
        const content = contentDiv ? contentDiv.innerHTML.trim() : "";

        // Extract BibTeX
        const bibtexTag = doc.querySelector('#references-bibtex');
        const bibtex = bibtexTag ? bibtexTag.textContent.trim() : "";

        // Populate Fields
        document.getElementById('title').value = title;
        document.getElementById('date').value = date;
        document.getElementById('filename').value = file.name;
        document.getElementById('description').value = description;
        document.getElementById('bibtex').value = bibtex;
        quill.root.innerHTML = content;

        // Reset input so the same file can be re-imported if needed
        importInput.value = "";

        // Brief success feedback
        const originalText = importBtn.textContent;
        importBtn.textContent = "Imported!";
        importBtn.classList.add('success-flash');
        setTimeout(() => {
            importBtn.textContent = originalText;
            importBtn.classList.remove('success-flash');
        }, 2000);
    };
    reader.readAsText(file);
});

// This will be used to inject the real CSS for the preview
let ARTICLE_CSS_CONTENT = "";

// Fetch the article CSS on load
fetch('../assets/css/article.css')
    .then(response => response.text())
    .then(css => {
        ARTICLE_CSS_CONTENT = css;
    })
    .catch(err => {
        console.error("Failed to load article.css:", err);
        // Fallback or alert? Let's leave it for now.
    });

function generateArticleHTML(isPreview = false) {
    const title = document.getElementById('title').value || "Article Title";
    const dateInput = document.getElementById('date').value;
    const description = document.getElementById('description').value || "Short description...";
    const bibtex = document.getElementById('bibtex').value || "";
    let content = quill.root.innerHTML;

    // Post-process HTML to remove editor-only artifacts
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    doc.querySelectorAll('.video-driver').forEach(el => el.remove());
    content = doc.body.innerHTML;

    // Formatting Citations Script
    const CITATION_INIT_SCRIPT = `
        <script src="https://cdnjs.cloudflare.com/ajax/libs/citation-js/0.7.16/citation.min.js"></script>
        <script>
            document.addEventListener('DOMContentLoaded', () => {
                const bibtex = document.getElementById('references-bibtex').textContent.trim();
                const Cite = (typeof require === 'function') ? require('citation-js') : window.citation.Cite;
                if (!bibtex || !Cite) return;

                const fullCite = new Cite(bibtex);
                
                // Collect all used citation keys from the document
                const usedKeys = new Set();
                document.querySelectorAll('.citation').forEach(span => {
                    usedKeys.add(span.getAttribute('data-cite'));
                });

                // Filter entries to only those that were cited
                const citedData = fullCite.data.filter(entry => usedKeys.has(entry.id));
                if (citedData.length === 0) return;

                const cite = new Cite(citedData);

                // Process citations
                document.querySelectorAll('.citation').forEach(span => {
                    const key = span.getAttribute('data-cite');
                    const ref = cite.data.find(entry => entry.id === key);
                    if (!ref) {
                        span.innerHTML = '<span class="citation-error">' + key + '</span>';
                        return;
                    }
                    const singleCite = new Cite(ref);
                    const citation = singleCite.format('citation', {
                        format: 'html',
                        template: 'apa',
                        lang: 'en-US'
                    });
                    span.innerHTML = '<a href="#ref-' + key + '">' + citation.trim() + '</a>';
                });

                // Add bibliography
                const bibliography = cite.format('bibliography', {
                    format: 'html',
                    template: 'apa',
                    lang: 'en-US'
                });

                // Inject bibliography div if not present
                let bibDiv = document.getElementById('bibliography');
                if (!bibDiv) {
                    bibDiv = document.createElement('div');
                    bibDiv.id = 'bibliography';
                    document.getElementById('content').appendChild(bibDiv);
                }
                bibDiv.innerHTML = '<h2>References</h2>' + bibliography;

                // Add anchors to bibliography entries
                bibDiv.querySelectorAll('.csl-entry').forEach(entry => {
                    const key = entry.getAttribute('data-csl-entry-id');
                    if (key) entry.setAttribute('id', 'ref-' + key);
                });
            });
        </script>
    `;

    // Format date
    let formattedDate = "Publish Date";
    let isoDate = dateInput || new Date().toISOString().split('T')[0];
    if (dateInput) {
        const dateObj = new Date(dateInput + 'T00:00:00');
        const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
        formattedDate = dateObj.toLocaleDateString('en-US', options);
    }

    return `<!DOCTYPE HTML>
<html lang="en">
	<head>
        <!-- Google tag (gtag.js) -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-H63S8PZ4SB"></script>
        <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-H63S8PZ4SB');
        </script>

		<!-- Standard Header Tags -->
		<title>BITSTREAM - ${title}</title>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
		<meta name="author" content="Dhruba Jyoti Paul">

        <!-- ARTICLE DEPENDENT -->
        <meta name="keywords" content="${title.toLowerCase().split(' ').join(', ')}">
        <meta name="description" content="${description.replace(/"/g, '&quot;')}">

        <!-- Links -->
        ${isPreview ? `<style>${ARTICLE_CSS_CONTENT}</style>` : '<link rel="stylesheet" href="../assets/css/article.css" />'}
		<link rel="icon" type="image/x-icon" href="../assets/images/tab_icon.png">
		<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
        
        <style>
            /* Built-in Styles for RTF Content consistency */
            .ql-syntax {
                background-color: #23241f;
                color: #f8f8f2;
                border-radius: 4px;
                padding: 15px;
                overflow: visible;
                white-space: pre-wrap;
                margin-bottom: 15px;
                font-family: Monaco, Consolas, "Andale Mono", "Ubuntu Mono", monospace;
                line-height: 1.5;
            }
            img { max-width: 100%; height: auto; border-radius: 8px; margin-top: 20px; }
            iframe { width: 100%; aspect-ratio: 16/9; border: none; border-radius: 8px; margin-top: 20px; }
            blockquote { border-left: 4px solid #ccc; padding-left: 15px; font-style: italic; margin: 20px 0; }
            
            .citation { font-weight: bold; }
            .citation a { text-decoration: none; color: inherit; }
            .citation-error { color: #f85149; text-decoration: underline wavy; cursor: help; }
            #bibliography { margin-top: 50px; border-top: 1px solid #ccc; padding-top: 20px; }
            .csl-entry { margin-bottom: 10px; font-size: 0.9rem; }
        </style>
	</head>
	<body>
        <div id="main">
            <!-- Back Button -->
            <span class="previous">&#8592; <a class="previous_button" href="../index.html">Back</a></span>
            
            <!-- CONTENT -->
            <div id="content" itemscope itemtype="http://schema.org/Article">
                <h1><span itemprop="name">${title}</span></h1>
                <h5 id="citation">By <span itemprop="author">Dhruba Jyoti Paul</span> | <time itemprop="datePublished" datetime="${isoDate}">${formattedDate}</time></h5>
                <div itemprop="articleBody">
                    ${content}
                </div>
            </div>

            <!-- BibTeX Data -->
            <script id="references-bibtex" type="application/x-bibtex">${bibtex}</script>
            ${CITATION_INIT_SCRIPT}

            <!-- Home Page Link -->
            <div class="home">
                <a href="../index.html">DJ's BITSTREAM</a>
            </div>

            <!-- Copyright -->
            <div id="footer">
                <div class="footer-icons">
                    <a href="https://www.linkedin.com/in/dj-paul/" class="fa fa-linkedin-square" target="_blank"></a>
                    <a href="https://github.com/djpaul-dev" class="fa fa-github-square" target="_blank"></a>
                    <a href="mailto:dhruba.j.paul+FromPortfolio@gmail.com" class="fa fa-envelope"></a>
                    <a href="https://djpaul.dev" class="fa fa-globe"></a>
                </div>
                <div class="footer-copyright">
                    &copy; Dhruba Jyoti Paul
                </div>
            </div>	            
        </div>
	</body>
</html>`;
}

// Preview Logic - Open in new tab
previewBtn.addEventListener('click', () => {
    const html = generateArticleHTML(true);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
});

postForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const dateInput = document.getElementById('date').value;
    let filename = document.getElementById('filename').value;

    if (!filename.toLowerCase().endsWith('.html')) {
        filename += '.html';
    }

    const articleHtml = generateArticleHTML();

    // Format date for snippets
    const dateObj = new Date(dateInput + 'T00:00:00');
    const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
    const formattedDate = dateObj.toLocaleDateString('en-US', options);

    // Generate Index Snippet
    const indexSnippet = `<!-- Article -->
<article>
    <header>
        <a class="article_title" href="articles/${filename}"><h2>${title}</h2></a>
        <span class="date">${formattedDate}</span>
    </header>
    <div class="article_desc">
        ${description}
        <a class="read_more" href="articles/${filename}">Read more</a>
    </div>
</article>`;

    // Show output
    document.getElementById('article-html-output').textContent = articleHtml;
    document.getElementById('index-snippet-output').textContent = indexSnippet;
    outputSection.classList.remove('hidden');
    outputSection.scrollIntoView({ behavior: 'smooth' });

    const genMsg = document.getElementById('gen-message');
    genMsg.textContent = "Article code generated!";
    genMsg.className = "success";
    genMsg.classList.remove('hidden');

    // Download Logic
    document.getElementById('download-btn').onclick = () => {
        const blob = new Blob([articleHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };
});

// Copy Functionality
document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const text = document.getElementById(targetId).textContent;
        navigator.clipboard.writeText(text).then(() => {
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        });
    });
});
