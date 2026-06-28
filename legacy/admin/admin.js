// Register Resize Module
Quill.register('modules/blotFormatter', QuillBlotFormatter.default);

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
                ['image', 'video'],
                ['cite'], // Added Cite button
                ['clean']
            ],
            handlers: {
                'cite': function () {
                    const range = this.quill.getSelection();
                    if (range) {
                        const key = prompt("Enter BibTeX Citation Key:");
                        if (key) {
                            this.quill.formatText(range.index, range.length, 'citation', key);
                        }
                    }
                }
            }
        }
    }
});

// Add custom icon for Cite button
const citeIcon = '<svg viewBox="0 0 18 18"><path class="ql-stroke" d="M11,4c-2.2,0-4,1.8-4,4s1.8,4,4,4s4-1.8,4-4S13.2,4,11,4z M11,10c-1.1,0-2-0.9-2-2s0.9-2,2-2s2,0.9,2,2S12.1,10,11,10z"/><path class="ql-fill" d="M5,14H3v-2h2V14z M8,14H6v-2h2V14z M11,14H9v-2h2V14z M14,14h-2v-2h2V14z"/></svg>';
const citeBtn = document.querySelector('.ql-cite');
if (citeBtn) citeBtn.innerHTML = citeIcon;

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
    const content = quill.root.innerHTML;

    // Formatting Citations Script
    const CITATION_INIT_SCRIPT = `
        <script src="https://cdnjs.cloudflare.com/ajax/libs/citation-js/0.7.16/citation.min.js"></script>
        <script>
            document.addEventListener('DOMContentLoaded', () => {
                const bibtex = document.getElementById('references-bibtex').textContent.trim();
                const Cite = (typeof require === 'function') ? require('citation-js') : window.citation.Cite;
                if (!bibtex || !Cite) return;

                const cite = new Cite(bibtex);

                // Process citations
                document.querySelectorAll('.citation').forEach(span => {
                    const key = span.getAttribute('data-cite');
                    const ref = cite.data.find(entry => entry.id === key);
                    if (!ref) {
                        span.innerHTML = '<span style="color: red;">[Ref: ' + key + ' not found]</span>';
                        return;
                    }
                    const singleCite = new Cite(ref);
                    const citation = singleCite.format('citation', {
                        format: 'html',
                        template: 'apa',
                        lang: 'en-US'
                    });
                    span.innerHTML = '<a href="#ref-' + key + '">' + citation + '</a>';
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
            
            .citation { font-size: 0.85em; vertical-align: super; font-weight: bold; }
            .citation a { text-decoration: none; color: inherit; }
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
