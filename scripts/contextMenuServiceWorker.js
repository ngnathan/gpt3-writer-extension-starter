const getKey = () => {
	return new Promise((resolve, reject) => {
		chrome.storage.local.get(['openai-key'], (result) => {
			if (result['openai-key']) {
				const decodedKey = atob(result['openai-key']);
				resolve(decodedKey);
			}
		});
	});
};

const setLoadingState = async () => {
	const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
	const activeTab = tabs[0].id;

	const response = await chrome.tabs.sendMessage(activeTab, { message: 'loading' });
	if (!response || !response.comments) return;
};

const retrieveComments = async () => {
	const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
	const activeTab = tabs[0].id;

	const response = await chrome.tabs.sendMessage(activeTab, { message: 'retrieveComments' });
	if (!response || !response.comments) return;
	return response.comments;
};

const sendMessage = (content) => {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		const activeTab = tabs[0].id;

		chrome.tabs.sendMessage(activeTab, { message: 'inject', content }, (response) => {
			if (response.status === 'failed') {
				console.log('injection failed.');
			}
		});
	});
};

const generate = async (prompt) => {
	// Get your API key from storage
	const key = await getKey();
	const url = 'https://api.openai.com/v1/completions';

	// Call completions endpoint
	const completionResponse = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${key}`
		},
		body: JSON.stringify({
			model: 'text-davinci-003',
			prompt: prompt,
			max_tokens: 1250,
			temperature: 0.7
		})
	});

	// Select the top choice and send back
	const completion = await completionResponse.json();
	return completion.choices.pop();
};

const generateCompletionAction = async (info) => {
	try {
		await setLoadingState();
		const comments = await retrieveComments();
		if (!comments || comments.length < 1) return;
		const basePromptPrefix = `Provide a summary of the following comments including the positive and negative aspects.`;
		const prompt = `${basePromptPrefix}${comments.map((comment) => `\nComment: ${comment}`)}
    Summary:
    `;
		const baseCompletion = await generate(prompt);
		sendMessage(baseCompletion.text);
	} catch (error) {
		console.log(error);
	}
};

chrome.contextMenus.create({
	id: 'context-run',
	title: 'Analyze comments on this page'
});

chrome.contextMenus.onClicked.addListener(generateCompletionAction);
