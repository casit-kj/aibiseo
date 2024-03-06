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
        await chatList();
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
    message_box.scrollTop(message_box[0].scrollHeight);
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
    const chatUserContent = $('#chat_user_content');
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


    await remove_cancel_button();
    await moveWindowScroll(message_box)
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
    const userId = $('#user_id');
    const dialogId = $('#dialog_id');
    const createAt = $('#create_at');
    console.log(previousChat);
    /** 질문 요청 */
    let askJson = {
        "question": message,
        "reference": arrayBwDataset,
        "past_dialog": previousChat,
        "user_id":userId.val(),
        "dialog_id":dialogId.val(),
        "create_at":createAt.val()
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
        if(response['result']['status']) {
            const datatset = response['result'];
            dialogId.val(datatset.dialog_id);
            createAt.val(datatset.dialog_create_at);
            $(`#llm_${window.token}`).append(datatset.answer);
            chatAssistantContent.val(datatset.answer);
            window.scrollTo(0, 0);
            await remove_cancel_button();
        } else {

            await remove_cancel_button();
            $('#cursor').remove();
            $(`#llm_${window.token}`).append(`죄송합니다! 문제가 발생했습니다. 다시 시도해 주시거나 페이지를 새로고침 해주세요. `);
            chatAssistantContent.val(`죄송합니다! 문제가 발생했습니다. 다시 시도해 주시거나 페이지를 새로고침 해주세요. `);

            window.scrollTo(0, 0);
        }}
    catch (error) {

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

            await remove_cancel_button();


            $('#cursor').remove();
            $(`#llm_${window.token}`).append(`죄송합니다! 문제가 발생했습니다. 다시 시도해 주시거나 페이지를 새로고침 해주세요. `);

            window.scrollTo(0, 0);
        }}
    catch (error) {

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
    $('#chat_user_id').val(uuid());
    $('#chat_dialog_id').val(uuid());
    const message_box = $('#messages');
    const message_input = $('#message-input');


    // 입력초기화
    message_input.val('');
    message_input.html('');
    message_input.text('');

    message_box.empty();
    await chatList();
}

/**
 * 저장된 대화 불러오기
 * @returns {*[]}
 */
function previousConversations(){
    let messages = [];
    // 모든 'content' 클래스를 가진 요소들의 텍스트를 반복하여 출력
    let qna_id = "";
    let conversation = null;
    $('.content').each(function() {
        let sentence = $(this).text();
        let elementId = $(this).attr('id');
        let pairElementId = elementId.split("_");
        let key = pairElementId[0].trim();
        let value = pairElementId[1];

        if(value != qna_id) {        
            if(key == "user") {
                conversation = {};
                conversation.question = sentence;
                qna_id = value;
            }
            count = 1
        } else {  
            if(key == "llm") {
                conversation.answer = sentence;
            }
            messages.push(conversation);
            conversation = null;                         
        }
    });
    return messages;
}

/**
 * UUID생성
 * @returns {string}
 */
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

/**
 * 저장된 채팅 리스트 데이터 가져오기
 * @returns {Promise<void>}
 */
async function chatList(){
    const insertChat = $('#listCating');

    let formData = insertChat.serializeArray();
    console.log(formData);
    try {
        const response = await $.ajax({
            url: "/api/chatList",
            type: "GET"
        });
        console.log(response);
        if(response["status"]) {
            const dataSet = response["result_Data"];
            await chatListup(dataSet);
        } else {
            console.log(response["result_Data"]);
        }
    } catch (error) {
        console.log(error);
    }

}

/**
 * 채팅 리스트 데이터 출력하기
 * @param dataSet
 * @returns {Promise<void>}
 */
async function chatListup(dataSet){
    const addConvo = $('#add_convo');
    addConvo.empty();
    dataSet.forEach(function (data) {
        let idName = data[0];
        let chatListTitle = data[4];
        let divConvo = $("<div></div>").addClass("convo")
            .attr("id",idName);
        let divLeft = $("<div></div>").addClass("left");
        let iIcon = $("<i></i>").addClass("fa-regular fa-comments");
        let spanConvoTitle = $("<span></span>").addClass("convo-title")
            .text(chatListTitle)
            .attr('onclick',"loadChat('"+idName+"')");
        let iShow = $("<i></i>").addClass("fa-regular fa-trash")
            .attr('onclick',"show_option('"+idName+"')")
            .attr('id',"conv-"+idName);
        let iDelete = $("<i></i>").addClass("fa-regular fa-check")
            .css("display","none")
            .attr('onclick',"deleteChat('"+idName+"')")
            .attr('id',"yes-"+idName);
        let iHide = $("<i></i>").addClass("fa-regular fa-x")
            .css("display","none")
            .attr('onclick',"hide_option('"+idName+"')")
            .attr('id',"not-"+idName);
        divLeft.append(iIcon,spanConvoTitle);
        divConvo.append(divLeft,iShow,iDelete,iHide);
        addConvo.append(divConvo);
    });
}
/**
 * 저장된 채팅 내역 데이터 불러오기
 * @param idName
 * @returns {Promise<void>}
 */
async function loadChat(idName){
    const loadCating = $('#loadCating');
    const loadId = $('#loadId');
    const message_box = $('#messages');

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
    await moveWindowScroll(message_box);
}
async function deleteChat(idName){
    console.log(idName);
    let deleteId = {"deleteId": idName}

    try {
        const response = await $.ajax({
            url: "/api/delDialog",
            type: "POST",
            contentType: 'application/json',
            dataType: "json",
            data: deleteId,
        });
        console.log(response);
        if(response["status"]) {
            console.log(response["message"]);
            await chatList();
        } else {
            console.log(response["message"]);
        }
    } catch (error) {
        console.log(error);
    }
}
/**
 * 불러온 채팅 내역 데이터 출력하기
 * @param dataSet
 * @returns {Promise<void>}
 */
async function loadChatList(dataSet){
    const message_box = $('#messages');
    const insertOldData = dataSet[0];
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


        /** GenAI 아이콘 */
        let divgMessage = $("<div></div>").addClass("message");
        let divgUser = $("<div></div>").addClass("user");
        divgUser.append(brainwise_image);
        divgMessage.append(divgUser);

        /** GenAI 답변 */
        let divgContent= $("<div></div>").addClass("content")
            .attr('id','llm_'+data.chat_qna_id);
        let divgCursor = $("<div></div>").addClass("cursor");
        divgContent.append(divgCursor);
        divgMessage.append(data.chat_assistant_content, divgContent);
        message_box.append(divgMessage);
    });


    /**GenAI 대화창 자동 스크롤 기능 */
    await moveWindowScroll(message_box);
}

async function clearConversations() {
    const cname = {"name" : "cname","value":"chatbot"};
    const cmd = {"name" : "cmd","value":"erase"};
    const keycode = {"name" : "keycode","value":"8e8aa899d03dc37653a99d887f6e22daf14ec163159d1e6e1ae9c9f0b1e22e1a"};

    let formData = [];
    formData.push(cname,cmd,keycode)


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
            await chatList();
        } else {
            console.log(response["message"]);
        }
    } catch (error) {
        console.log(error);
    }
    await hideClear();
}

/**
 * 대화 삭제 확인
 * @param conversation_id
 * @returns {Promise<void>}
 */
async function show_option(conversation_id){
    $(`#conv-${conversation_id}`).hide();
    $(`#yes-${conversation_id}`).show();
    $(`#not-${conversation_id}`).show();
}

/**
 * 대화 삭제 취소
 * @param conversation_id
 * @returns {Promise<void>}
 */
async function hide_option (conversation_id){
    $(`#conv-${conversation_id}`).show();
    $(`#yes-${conversation_id}`).hide();
    $(`#not-${conversation_id}`).hide();
}


/**
 * 대화 전체 삭제 확인
 * @returns {Promise<void>}
 */
async function showClear(){
    $("#clear-conversations").hide();
    $("#confirm-conversations").show();
}

/**
 * 데이터 전체 삭제 취소
 * @returns {Promise<void>}
 */
async function hideClear(){
    $("#clear-conversations").show();
    $("#confirm-conversations").hide();
}