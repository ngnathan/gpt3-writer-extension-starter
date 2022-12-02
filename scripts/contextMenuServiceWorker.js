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

const retrieveComments = async () => {
	const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

	console.log('tabs', tabs);
	const activeTab = tabs[0].id;

	const response = await chrome.tabs.sendMessage(activeTab, { message: 'retrieveComments' });
	if (!response || !response.comments) return;
	return response.comments;
};

const sendMessage = (content) => {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		console.log('tabs', tabs);
		const activeTab = tabs[0].id;

		chrome.tabs.sendMessage(activeTab, { message: 'inject', content }, (response) => {
			console.log('response', response);
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
		const comments = await retrieveComments();
		console.log('comments', comments);
		if (!comments || comments.length < 1) return;
		const basePromptPrefix = `Provide a summary of the following comments including the positive and negative aspects.`;
		const prompt = `${basePromptPrefix}${comments.map((comment) => `\nComment: ${comment}`)}
    Summary:
    `;
		console.log('prompt', prompt);
		const baseCompletion = await generate(prompt);
		console.log('baseCompletion.text', baseCompletion.text);
		sendMessage(baseCompletion.text);
		// sendMessage(
		// 	`Positive Aspects: \n- Putting out a video to stick to the truth and look out for all of us is appreciated.\n- It is important to voice concerns and distinguish between diligently organized events and cash grab operations.\n- There is respect for facing something uncomfortable like this and doing the right thing. - It is beneficial for people to be aware of the less savory things so they don’t get caught up in nefarious and sketchy stuff. - It is beneficial to the tech community to share experiences and make sure this sort of thing doesn't happen again. - It is beneficial to share the failure of a conference so others do not get caught up in the same situation. - It is beneficial to call people out and put them on blast. Negative Aspects: - The organizer of the conference failed to attract attendees. - The organizer failed to cover travel and accommodation for speakers. - The organizer gaslit a lot of people who were speaking up. - The organizer acted like the whole thing went great. - The organizer should never organize an event again. - The organizer may have yielded little to no ROI.`
		// );
	} catch (error) {
		console.log(error);
	}
};

chrome.contextMenus.create({
	id: 'context-run',
	title: 'Analyze comments on this page'
});

chrome.contextMenus.onClicked.addListener(generateCompletionAction);
