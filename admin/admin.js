// Register Resize Module
Quill.register('modules/blotFormatter', QuillBlotFormatter.default);

// Initialize Quill Editor
const quill = new Quill('#editor-container', {
    theme: 'snow',
    modules: {
        blotFormatter: {}, // Enable resizing
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline'],
            ['link', 'blockquote', 'code-block'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['image', 'video'],
            ['clean']
        ]
    }
});

const postForm = document.getElementById('post-form');
const outputSection = document.getElementById('output-section');
const previewBtn = document.getElementById('preview-btn');
const previewModal = document.getElementById('preview-modal');
const closePreview = document.getElementById('close-preview');
const previewContent = document.getElementById('content-preview');

// Preview Logic
previewBtn.addEventListener('click', () => {
    const title = document.getElementById('title').value || "Article Title";
    const dateInput = document.getElementById('date').value;
    const content = quill.root.innerHTML;

    // Format date for preview
    let formattedDate = "Publish Date";
    if (dateInput) {
        const dateObj = new Date(dateInput + 'T00:00:00');
        const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
        formattedDate = dateObj.toLocaleDateString('en-US', options);
    }

    previewContent.innerHTML = `
        <h1>${title}</h1>
        <h5>By Dhruba Jyoti Paul | ${formattedDate}</h5>
        <div>${content}</div>
    `;
    previewModal.classList.remove('hidden');
});

closePreview.addEventListener('click', () => {
    previewModal.classList.add('hidden');
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === previewModal) {
        previewModal.classList.add('hidden');
    }
});

postForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('title').value;
    const dateInput = document.getElementById('date').value;
    let filename = document.getElementById('filename').value;
    const description = document.getElementById('description').value;
    const content = quill.root.innerHTML;

    // Ensure filename ends with .html
    if (!filename.toLowerCase().endsWith('.html')) {
        filename += '.html';
    }

    // Format date for display (e.g., July 2, 2024)
    // Use UTC components to avoid timezone offsets causing "previous day" issues
    const dateObj = new Date(dateInput + 'T00:00:00'); 
    const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
    const formattedDate = dateObj.toLocaleDateString('en-US', options);
    const isoDate = dateInput; // YYYY-MM-DD

    // Generate Article HTML (Template based on articles/article1.html)
    const articleHtml = `<!DOCTYPE HTML>
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
        <link rel="stylesheet" href="../assets/css/article.css" />
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

    // Generate Index Snippet (Template based on index.html)
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

    // Request the agent to save the file
    // We'll use a special comment or console log that the agent can "read"
    console.log(`CREATE_ARTICLE: articles/${filename}`);
    console.log(`CONTENT_START\n${articleHtml}\nCONTENT_END`);

    // In a real browser this wouldn't work, but for our "agent" we can use this to signal
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
