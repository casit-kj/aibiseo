const format = (text) => {
    return text.replace(/(?:\r\n|\r|\n)/g, "<br>");
};

function resizeTextarea(textarea) {
    textarea.style.height = '80px';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
}

/**
 * 아이디 생성
 * @returns {string}
 */
const message_id = () => {
    random_bytes = (Math.floor(Math.random() * 1338377565) + 2956589730).toString(
        2
    );
    unix = Math.floor(Date.now() / 1000).toString(2);

    return BigInt(`0b${unix}${random_bytes}`).toString();
};

const remove_cancel_button = async () => {
    const stop_generating = $('.stop_generating');

    stop_generating.addClass('stop_generating-hiding'); // Hiding 클래스 추가

    setTimeout(() => {
        stop_generating.removeClass('stop_generating-hiding'); // Hiding 클래스 제거
        stop_generating.addClass('stop_generating-hidden'); // Hidden 클래스 추가
    }, 300);
};

async function askGenAI(){
    const message_input = $('#message-input');
    message_input.css('height','80px');
    message_input.focus();
    $(window).scrollTop(0); // 페이지의 맨 위로 스크롤
    let message = message_input.val();
    console.log(message);

    if (message.length > 0) {
        message_input.value = ``;
        previousChat  = previousConversations();
        bw_dataset = await requestBWData(message);
        await searchResult(bw_dataset);
        arrayDataset = bwDatasetToArray(bw_dataset);
        await requestGenAI(message, arrayDataset, previousChat);
        await insertChating();
    }
}

/**
 * 브레인와이즈 데이터 검색
 * @param {*} message
 */
async function requestBWData(message){
    $('#contentbw_QK').val(format(message));
    const formSearch = $("#resultForm");
    const formSearchArray = formSearch.serializeArray();
    console.log(formSearchArray);
    try {
        const response = await $.ajax({
            type: "POST",
            url: 'http://hub.aicasit.com/search',
            dataType: "json",
            data: formSearchArray,
        });
        console.log(response);
        if(response['status']) {
            const dataset = response['results']['document']['attachment']['document'];
            return dataset;
        } else {
        }
    } catch (error) {
        return null;
    }
}


/**
 * 사용자 대화창 자동 스크롤 기능
 */
async function moveWindowScroll(message_box) {
    message_box.scrollTop = message_box.scrollHeight;
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 500));
    window.scrollTo(0, 0);
}

/**
 * 생성형 AI 문장생성 요청
 * @param {*} message
 * @param arrayBwDataset
 * @param previousChat
 */
async function requestGenAI(message, arrayBwDataset, previousChat){
    const message_box = $('#messages');
    const stop_generating = $('.stop_generating');
    const message_input = $('#message-input');
    const chatQnaId = $('#chat_qna_id');
    const chatQnaAt = $('#chat_qna_at');
    const chatUserContent = $('#chat_user_content');
    let now = new Date();

    // 입력초기화
    message_input.val('');
    message_input.html('');
    message_input.text('');

    /**대화창 스크롤바 */
    window.scrollTo(0, 0);
    window.controller = new AbortController();
    window.text = '';
    window.token = message_id();

    chatQnaId.val(window.token);
    chatQnaAt.val(now.toISOString());
    chatUserContent.val(format(message));

    stop_generating.removeClass('stop_generating-hidden');

    /**사용자 아이콘 및 질문 텍스트*/
    let divMessage = $("<div></div>").addClass("message");
    let divUser = $("<div></div>").addClass("user");
    divUser.append(user_image);
    divMessage.append(divUser);
    let divContent= $("<div></div>").addClass("content")
        .attr('id','user_'+window.token);
    divContent.append(format(message));
    divMessage.append(divContent);
    message_box.append(divMessage);

    /**사용자 대화창 자동 스크롤 기능 */
    await moveWindowScroll(message_box)

    /** GenAI 아이콘 및 답변창 */
    let divgMessage = $("<div></div>").addClass("message");
    let divgUser = $("<div></div>").addClass("user");
    divgUser.append(brainwise_image);
    divgMessage.append(divgUser);
    let divgContent= $("<div></div>").addClass("content")
        .attr('id','llm_'+window.token);
    let divgCursor = $("<div></div>").addClass("cursor");
    divgContent.append(divgCursor);
    divgMessage.append(divgContent);
    message_box.append(divgMessage);

    /**GenAI 대화창 자동 스크롤 기능 */
    await moveWindowScroll(message_box)

    /** 라마 요청 */
    await requestGenAI_LLAMA(message_box, message, arrayBwDataset, previousChat)

    /**GPT 요청*/
    // await requestGenAI_GPT(message_box, message)

    message_box.scrollTop = message_box.scrollHeight;
    await remove_cancel_button();

}

/**
 * 라마 LLM 요청
 * @param {*} message_box
 * @param {*} message
 * @param arrayBwDataset
 * @param previousChat
 */
async function requestGenAI_LLAMA(message_box, message, arrayBwDataset, previousChat) {
    const chatAssistantContent = $('#chat_assistant_content');
    const chatAssistantEndat = $('#chat_assistant_endat');
    const chatAssistantStartat = $('#chat_assistant_startat');
    let startAt = new Date();
    chatAssistantStartat.val(startAt.toISOString());

    /** 질문 요청 */
    let askJson = {
        "query": message,
        "reference": arrayBwDataset,
        "history": previousChat
    };
    const sendAksJson = JSON.stringify(askJson);
    console.log(sendAksJson);
    try {
        const response = await $.ajax({
            type: "POST",
            url: '/api/chat',
            contentType: 'application/json',
            dataType: "json",
            data: sendAksJson,
        });
        console.log(response);
        let endAt = new Date();
        chatAssistantEndat.val(endAt.toISOString());
        if(response['result']['status']) {
            const datatset = response['result'];
            $(`#llm_${window.token}`).append(datatset.text);
            chatAssistantContent.val(datatset.text);
            window.scrollTo(0, 0);
            await remove_cancel_button();
        } else {
            message_box.scrollTop = message_box.scrollHeight;
            await remove_cancel_button();
            $('#cursor').remove();
            $(`#llm_${window.token}`).append(`죄송합니다! 문제가 발생했습니다. 다시 시도해 주시거나 페이지를 새로고침 해주세요. `);
            chatAssistantContent.val(`죄송합니다! 문제가 발생했습니다. 다시 시도해 주시거나 페이지를 새로고침 해주세요. `);

            window.scrollTo(0, 0);
        }}
    catch (error) {
        let endAt = new Date();
        chatAssistantEndat.val(endAt.toISOString());
        message_box.scrollTop = message_box.scrollHeight;
        await remove_cancel_button();
        console.log(error);
        $('#cursor').remove();

        if (error.name !== `AbortError`) {
            $(`#llm_${window.token}`).append(`죄송합니다! 문제가 발생했습니다. 다시 시도해 주시거나 페이지를 새로고침 해주세요.`);
            chatAssistantContent.val(`죄송합니다! 문제가 발생했습니다. 다시 시도해 주시거나 페이지를 새로고침 해주세요. `);

        } else {
            $(`#llm_${window.token}`).append(` [중단됨]`);
            chatAssistantContent.val(` [중단됨]`);

        }

        window.scrollTo(0, 0);
    }
}


/**
 * ChatGPT 요청
 * @param message_box
 * @param {*} message
 */
async function requestGenAI_GPT(message_box, message){
    let jsonSend = {};
    jsonSend.query=message;
    const jsonTpyeData = JSON.stringify(jsonSend);
    console.log(jsonSend);
    try {
        const response = await $.ajax({
            type: "POST",
            url: 'http://hub.aicasit.com/api/chat',
            dataType: "json",
            data: jsonTpyeData,
        });
        console.log(response);
        if(response['status']) {
            const datatset = response['results'][0];
            $(`#llm_${window.token}`).append(datatset.text);
            window.scrollTo(0, 0);
            await remove_cancel_button();
        } else {
            message_box.scrollTop = message_box.scrollHeight;
            await remove_cancel_button();


            $('#cursor').remove();
            $(`#llm_${window.token}`).append(`죄송합니다! 문제가 발생했습니다. 다시 시도해 주시거나 페이지를 새로고침 해주세요. `);

            window.scrollTo(0, 0);
        }}
    catch (error) {
        message_box.scrollTop = message_box.scrollHeight;
        await remove_cancel_button();


        console.log(error);

        $('#cursor').remove();

        if (error.name !== `AbortError`) {
            $(`#llm_${window.token}`).append(`죄송합니다! 문제가 발생했습니다. 다시 시도해 주시거나 페이지를 새로고침 해주세요.`);
        } else {
            $(`#llm_${window.token}`).append(` [중단됨]`);
        }

        window.scrollTo(0, 0);
    }
}

async function searchResult(dataset){
    const resultbox = $('.resultbox');
    resultbox.empty();
    dataset.forEach(function (data) {
        let titlePageNoAName = data.owner_file+' > '+data.img_file;
        let divTitle = $("<div></div>").addClass("rcontent");
        let spanTitle = $("<span></span>").text(titlePageNoAName);
        divTitle.append(spanTitle);
        let divContent = $("<div></div>").addClass("search-content");
        let spanContent = $("<span></span>").text(data.content);
        divContent.append(spanContent);
        resultbox.append(divTitle,divContent);
    });
}

function bwDatasetToArray(dataset) {
    dataArray = []
    dataset.forEach(function (data) {
        dataArray.push(data.content)
    });
    return dataArray;
}

/**
 * 채팅창 추가
 * @returns {Promise<void>}
 */
async function new_conversation (){
    history.pushState({}, null, `/`);
    window.conversation_id = uuid();

    await clear_conversation();
    await load_conversations(20, 0, true);
};

const load_conversation = async (conversation_id) => {
    let conversation = await JSON.parse(
        localStorage.getItem(`conversation:${conversation_id}`)
    );
    console.log(conversation, conversation_id);

    for (item of conversation.items) {
        message_box.innerHTML += `
            <div class="message">
                <div class="user">
                    ${item.role == "assistant" ? gpt_image : user_image}
                    ${
            item.role == "assistant"
                ? `<i class="fa-regular fa-phone-arrow-down-left"></i>`
                : `<i class="fa-regular fa-phone-arrow-up-right"></i>`
        }
                </div>
                <div class="content">
                    ${
            item.role == "assistant"
                ? markdown.render(item.content)
                : item.content
        }
                </div>
            </div>
        `;
    }

    document.querySelectorAll(`code`).forEach((el) => {
        hljs.highlightElement(el);
    });

    message_box.scrollTo({ top: message_box.scrollHeight, behavior: "smooth" });

    setTimeout(() => {
        message_box.scrollTop = message_box.scrollHeight;
    }, 500);
};

const get_conversation = async (conversation_id) => {
    let conversation = await JSON.parse(
        localStorage.getItem(`conversation:${conversation_id}`)
    );
    return conversation.items;
};

const add_conversation = async (conversation_id, title) => {
    if (localStorage.getItem(`conversation:${conversation_id}`) == null) {
        localStorage.setItem(
            `conversation:${conversation_id}`,
            JSON.stringify({
                id: conversation_id,
                title: title,
                items: [],
            })
        );
    }
};

function previousConversations(){
    let messages = [];
    // 모든 'content' 클래스를 가진 요소들의 텍스트를 반복하여 출력
    $('.content').each(function() {
        let elementId = $(this).attr('id');
        // id 값 내에서 특정 단어가 포함되어 있는지 확인합니다.
        if (elementId.includes('user')) {
            messages.push({"sender": "user", "content": $(this).text()});
        } else {
            messages.push({"sender": "assistant", "content": $(this).text()});
        }
    });
    return messages
}

const uuid = () => {
    return `xxxxxxxx-xxxx-4xxx-yxxx-${Date.now().toString(16)}`.replace(
        /[xy]/g,
        function (c) {
            var r = (Math.random() * 16) | 0,
                v = c == "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        }
    );
};

async function insertChating(){
    const insertChat = $('#insertChat');
    const chatCreate = $('#chat_create_at');
    let now = new Date();
    if(chatCreate.val() === ""){
        // 현재시간 입력
        chatCreate.val(now.toISOString());
    }
    let formData = insertChat.serializeArray();
    console.log(formData);
    try {
        const response = await $.ajax({
            url: "http://hub.aicasit.com/doIndexDoc",
            type: "POST",
            dataType: "json",
            data: formData,
        });
        console.log(response);
        if(response["status"]) {
            console.log(response["message"]);
        } else {
            console.log(response["message"]);
        }
    } catch (error) {
        console.log(error);
    }

}

async function chatList(){
    const insertChat = $('#listCating');

    let formData = insertChat.serializeArray();
    console.log(formData);
    try {
        const response = await $.ajax({
            url: "http://hub.aicasit.com/search",
            type: "POST",
            dataType: "json",
            data: formData,
        });
        console.log(response);
        if(response["status"]) {
            console.log(response["message"]);
            const dataSet = response["results"]["document"]["chat_dialog_id"]["documents"];
            await chatListup(dataSet);
        } else {
            console.log(response["message"]);
        }
    } catch (error) {
        console.log(error);
    }

}

async function chatListup(dataSet){
    const listBox = $('#listBox');

    Object.keys(dataSet).forEach(key => {
        let idName = dataSet[key].name;
        let divConvo = $("<div></div>").addClass("convo")
            .attr("id",idName);
        let divLeft = $("<div></div>").addClass("left");
        let iIcon = $("<i></i>").addClass("fa-regular fa-comments");
        let spanConvoTitle = $("<span></span>").addClass("convo-title")
            .text(idName)
            .attr('onclick',"loadChat('"+idName+"')");
        let iShow = $("<i></i>").addClass("fa-regular fa-trash");
        let iDelete = $("<i></i>").addClass("fa-regular fa-check")
            .css("display","none");
        let iHide = $("<i></i>").addClass("fa-regular fa-x")
            .css("display","none");
        divLeft.append(iIcon,spanConvoTitle);
        divConvo.append(divLeft,iShow,iDelete,iHide);
        listBox.append(divConvo);
    });
}

async function loadChat(idName){
    const loadCating = $('#loadCating');
    const loadId = $('#loadId');

    loadId.val(idName);

    let formData = loadCating.serializeArray();
    console.log(formData);
    try {
        const response = await $.ajax({
            url: "http://hub.aicasit.com/search",
            type: "POST",
            dataType: "json",
            data: formData,
        });
        console.log(response);
        if(response["status"]) {
            console.log(response["message"]);
            const dataSet = response["results"]["document"];
            await loadChatList(dataSet);
        } else {
            console.log(response["message"]);
        }
    } catch (error) {
        console.log(error);
    }
}

async function loadChatList(dataSet){
    const message_box = $('#messages');
    const insertOldData = dataSet[0];
    const insertChat = $('#insertChat');
    const chatUserId = $('#chat_user_id');
    const chatDialogId = $('#chat_dialog_id');
    const chatCreate = $('#chat_create_at');
    message_box.empty();
    chatUserId.val(insertOldData.chat_user_id);
    chatDialogId.val(insertOldData.chat_dialog_id);
    chatCreate.val(insertOldData.chat_create_at);



    dataSet.forEach(function (data){
        /**사용자 아이콘 및 질문 텍스트*/
        let divMessage = $("<div></div>").addClass("message");
        let divUser = $("<div></div>").addClass("user");
        divUser.append(user_image);
        divMessage.append(divUser);
        let divContent= $("<div></div>").addClass("content")
            .attr('id','user_'+data.chat_qna_id);
        divContent.append(data.chat_user_content);
        divMessage.append(divContent);
        message_box.append(divMessage);


        /** GenAI 아이콘 및 답변창 */
        let divgMessage = $("<div></div>").addClass("message");
        let divgUser = $("<div></div>").addClass("user");
        divgUser.append(brainwise_image);
        divgMessage.append(divgUser);
        let divgContent= $("<div></div>").addClass("content")
            .attr('id','llm_'+data.chat_qna_id);
        let divgCursor = $("<div></div>").addClass("cursor");
        divgContent.append(divgCursor);
        divgMessage.append(data.chat_assistant_content,divgContent);
        message_box.append(divgMessage);
    });


    /**GenAI 대화창 자동 스크롤 기능 */
    await moveWindowScroll(message_box)
}