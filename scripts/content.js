const insert = (content) => {
	console.log('insert content', content);
	const contentLines = content.split('\n');
	// Find Calmly editor input section
	const elements = document.getElementsByTagName('ytd-comments-header-renderer');

	if (elements.length === 0) {
		return;
	}

	const element = elements[0];

	const div = document.createElement('div');
	div.id = 'content-text';
	div.className = 'style-scope ytd-comment-renderer';

	const titleP = document.createElement('p');
	titleP.style = 'font-weight: bold; font-size: 1.2em; margin-bottom: 0.5em;';
	titleP.textContent = 'Overall sentiment of the comments:';
	div.appendChild(titleP);

	for (let item of contentLines) {
		const p = document.createElement('p');
		p.textContent = item;
		div.appendChild(p);
	}
	div.style = 'margin-bottom: 20px;';

	element.insertBefore(div, element.children[1]);

	return true;
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.message === 'inject') {
		const { content } = request;

		// Call this insert function
		const result = insert(content);

		// If something went wrong, send a failed status
		if (!result) {
			sendResponse({ status: 'failed' });
		}

		sendResponse({ status: 'success' });
	}
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.message === 'retrieveComments') {
		const elements = [];
		const comments = [];

		// Find all comments on the page
		// const elements = document.getElementsByClassName('style-scope ytd-comment-renderer');
		const elementsByTag = document.getElementsByTagName('yt-formatted-string');
		for (let item of elementsByTag) {
			if (
				item.getAttribute('id') === 'content-text' &&
				item.className === 'style-scope ytd-comment-renderer' &&
				item.textContent !== ''
			) {
				elements.push(item);
			}
		}
		console.log('elements', elements);
		if (elements && elements.length > 0) {
			elements.map((element) => comments.push(element.textContent));
		}

		sendResponse({ status: 'success', comments });
	}
});
