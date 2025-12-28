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

// This will be used to inject the real CSS for the preview
const ARTICLE_CSS_CONTENT = `
@import url('https://fonts.googleapis.com/css2?family=Amatic+SC:wght@400;700&family=Josefin+Sans:ital,wght@0,100..700;1,100..700&family=Nova+Square&family=Righteous&family=Roboto:wght@300;500;700&family=Tektur:wdth,wght@75..100,400..900&display=swap');

:root {
    --light_text: #6c6b6b;
    --backgroud_color: #E9DEBE;
    --max-width: 1000px;
}

body {
    background-color: var(--backgroud_color);
    background-attachment: fixed;
    display: flex;
    justify-content: center;
    min-height: 100vh;
    margin: 0;
}

#main {
    margin-top: 3%;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: var(--max-width);
    padding: 1rem;
}

.home {
    margin-top: 15%;
    align-self: center;
}

.home a {
    font-family: "Tektur", sans-serif;
    font-variation-settings: "wdth" 50;
    padding: 0.5rem;
    color: black;
    border: 5px double black;
    text-decoration: none;
    font-weight: 1000;
    font-size: 0.8rem;
    letter-spacing: 1px;
    transition: 0.5s;
}

.home a:hover {
    background: black;
    color: white;
    border: 5px double var(--backgroud_color);
}

#citation {
    color: var(--light_text);
}

.previous {
    color: rgb(140, 140, 140);
    display: inline;
}

.previous .previous_button {
    text-decoration: none;
    color: var(--light_text);
}

.previous_button:hover {
    text-decoration: underline;
    text-decoration-style: dotted;
    text-decoration-color: var(--light_text);
    text-underline-offset: 3px;
}

#footer {
    font-family: "Nova Square", sans-serif;
    color: var(--light_text);
    margin-top: 25%;
    display: flex;
    justify-content: space-between;
    width: 100%;
    max-width: var(--max-width);
    padding: 1rem;
}

#footer a {
    color: var(--light_text);
}

#footer .footer-icons {
    display: flex;
    gap: 25%;
}
`;

function generateArticleHTML(isPreview = false) {
    const title = document.getElementById('title').value || "Article Title";
    const dateInput = document.getElementById('date').value;
    const description = document.getElementById('description').value || "Short description...";
    const content = quill.root.innerHTML;

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
