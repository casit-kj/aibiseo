const format = (text) => {
    return text.replace(/(?:\r\n|\r|\n)/g, "<br>");
};

function resizeTextarea(textarea) {
    textarea.style.height = '80px';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
}


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
    const chBox = $('#toggle-slider').is(':checked');
    if ($('#messages .bwCom').length > 0) {
        // 'bwCom' 클래스를 가진 요소가 하나 이상 있을 경우, 'messages' div의 내용을 비웁니다.
        $('#messages').empty();
    }
    message_input.css('height','80px');
    message_input.focus();
    $(window).scrollTop(0); // 페이지의 맨 위로 스크롤
    let message = message_input.val();
    console.log(message);
    if (message.length > 0) {
        message_input.value = ``;
        previousChat  = previousConversations();
        await messageBoxGen(message);
        if (chBox){
            bw_dataset = await requestBWData(message);
            await searchResult(bw_dataset);
            arrayDataset = bwDatasetToArray(bw_dataset);
        } else {
            arrayDataset = [];
        }
        await requestGenAI(message, arrayDataset, previousChat);
        await chatList();
    }
}

/**
 * 답변창 생성
 * @returns {Promise<void>}
 */
async function messageBoxGen(message){
    const message_box = $('#messages');
    const stop_generating = $('.stop_generating');


    /**사용자 아이콘 및 질문 텍스트*/
    let divMessage = $("<div></div>").addClass("message");
    let divUser = $("<div></div>").addClass("user");
    divUser.append(user_image);
    divMessage.append(divUser);
    let divContent= $("<div></div>").addClass("content")
        .attr('id','user_temporary');
    divContent.append(format(formattedText(message)));
    divMessage.append(divContent);
    message_box.append(divMessage);

    /**사용자 대화창 자동 스크롤 기능 */
    await moveWindowScroll(message_box);

    stop_generating.removeClass('stop_generating-hidden');

        /** GenAI 아이콘 및 답변창 */
    let divgMessage = $("<div></div>").addClass("message");
    let divgUser = $("<div></div>").addClass("user");
    divgUser.append(brainwise_image);
    divgMessage.append(divgUser);
    let divgContent= $("<div></div>").addClass("content")
        .attr('id','llm_temporary');
    divgMessage.append(divgContent);
    message_box.append(divgMessage);

    /**GenAI 대화창 자동 스크롤 기능 */
    await moveWindowScroll(message_box)

}
/**
 * 브레인와이즈 데이터 검색
 * @param {*} message
 */
async function requestBWData(message){
    const answerBox = $('#llm_temporary');
    answerBox.empty();

    answerBox.append("BrainWise 참고자료를 수집중입니다.... ")

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
    const message_input = $('#message-input');
    const chatUserContent = $('#chat_user_content');
    const answerBox = $('#llm_temporary');
    answerBox.empty();

    answerBox.append("답변을 생성중입니다....")
    // 입력초기화
    message_input.val('');
    message_input.html('');
    message_input.text('');
    $('#send-button').prop('disabled', true);

    /**대화창 스크롤바 */
    window.scrollTo(0, 0);
    window.controller = new AbortController();

    chatUserContent.val(format(message));


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
            const questionId = $('#user_temporary');
            const answerId = $('#llm_temporary');
            answerId.empty();
            questionId.attr('id',"user_"+datatset.qna_id);
            answerId.attr('id',"llm_"+datatset.qna_id);
            $(`#llm_${datatset.qna_id}`).append(formattedText(datatset.answer));
            window.scrollTo(0, 0);
            await remove_cancel_button();
        } else {

            await remove_cancel_button();
            const answerId = $('#llm_temporary');
            answerId.empty();
            $(`#llm_temporary`).append(`죄송합니다! 문제가 발생했습니다. 다시 시도해 주시거나 페이지를 새로고침 해주세요. `);

            window.scrollTo(0, 0);
        }}
    catch (error) {

        await remove_cancel_button();
        console.log(error);
        if (error.name !== `AbortError`) {
            const answerId = $('#llm_temporary');
            answerId.empty();
            $(`#llm_temporary`).append(`죄송합니다! 문제가 발생했습니다. 다시 시도해 주시거나 페이지를 새로고침 해주세요.`);

        } else {
            const answerId = $('#llm_temporary');
            answerId.empty();
            $(`#llm_temporary`).append(` [중단됨]`);

        }

        window.scrollTo(0, 0);
    }
}


/**
 * BWsearch 검색결과 출력
 * @param {*} dataset 
 */
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

/**
 * 챗봇 질문시 BW검색결과 추가
 * @param {*} dataset 
 * @returns 
 */
function bwDatasetToArray(dataset) {
    dataArray = []
    dataset.forEach(function (data) {
        dataArray.push(data.content)
    });
    return dataArray;
}

/**
 * 새로운 채팅창 추가
 * @returns {Promise<void>}
 */
async function new_conversation (){
    $('#user_id').val("");
    $('#dialog_id').val("");
    $('#create_at').val("");
    const message_box = $('#messages');
    const message_input = $('#message-input');
    $('#send-button').prop('disabled', true);

    // 입력초기화
    message_input.val('');
    message_input.html('');
    message_input.text('');

    message_box.empty();
    await chatList();
    wellcomeBox();
}

/**
 * 기존 대화문 저장
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
            const dataSet = response["result_Data"]["result"]["answer"];
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
    const dialogId = $('#dialog_id');
    const message_box = $('#messages');

    dialogId.val(idName);

    let loadChatId = JSON.stringify({"loadChatId": idName})

    try {
        const response = await $.ajax({
            url: "/api/loadChat",
            type: "POST",
            dataType: "json",
            contentType: 'application/json',
            data: loadChatId,
        });
        console.log(response);
        if(response["status"]) {
            const dataSet = response["result_Data"]["result"]["answer"];
            await loadChatList(dataSet);
        } else {
            console.log(response["result_Data"]);
        }
    } catch (error) {
        console.log(error);
    }
    await moveWindowScroll(message_box);
}

/**
 * 대화 삭제
 * @param {대화 아이디} idName 
 */
async function deleteChat(idName){
    const dialogId = $('#dialog_id');

    // 삭제하는 대화가 현재 진행중이 대화의 경우
    if(dialogId.val() ===idName){
        await new_conversation();
    }

    let deleteId = JSON.stringify({"deleteId": idName})
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
            console.log(response["result_Data"]);
            await chatList();
        } else {
            console.log(response["result_Data"]);
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


    message_box.empty();




    dataSet.forEach(function (data){
        /**사용자 아이콘 및 질문 텍스트*/
        let divMessage = $("<div></div>").addClass("message");
        let divUser = $("<div></div>").addClass("user");
        divUser.append(user_image);
        divMessage.append(divUser);
                let divContent= $("<div></div>").addClass("content")
            .attr('id','user_'+data[0]);
        divContent.append(data[1]);
        divMessage.append(divContent);
        message_box.append(divMessage);


        /** GenAI 아이콘 */
        let divgMessage = $("<div></div>").addClass("message");
        let divgUser = $("<div></div>").addClass("user");
        divgUser.append(brainwise_image);
        divgMessage.append(divgUser);

        /** GenAI 답변 */
        let divgContent= $("<div></div>").addClass("content")
            .attr('id','llm_'+data[0]);
        let divgCursor = $("<div></div>").addClass("cursor");
        divgContent.append(divgCursor);
        divgMessage.append(formattedText(data[2]), divgContent);
        message_box.append(divgMessage);
    });


    /**GenAI 대화창 자동 스크롤 기능 */
    await moveWindowScroll(message_box);
}
/**
 * 채팅 대화내역 전부 삭제
 */
async function clearConversations() {
    try {
        const response = await $.ajax({
            url: "/api/clearConversations",
            type: "GET"
        });
        console.log(response);
        if(response["status"]) {
            console.log(response["result_Data"]);
            await new_conversation();
            await chatList();
        } else {
            console.log(response["result_Data"]);
            await new_conversation();
            await chatList();
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

function wellcomeBox(){
    const message_box = $('#messages');
    let bwComDiv = $("<div></div>").addClass("bwCom");
    let bwComBoxDiv = $("<div></div>").addClass("bwCom-Box");
    let bwImageImg = $("<img>").attr("src","/static/images/brainwise128x128.png")
        .attr("alt","brainwiseWellComeimage")
        .css("border-radius","20px")
        .css("margin-bottom","5px");
    bwComBoxDiv.append(bwImageImg);
    bwComBoxDiv.append("<br>무엇을 도와드릴까요?");
    bwComDiv.append(bwComBoxDiv);
    message_box.append(bwComDiv);
}
function formattedText(message){
    return message.replace(/\n/g, "<br>");
}

$('#cancelButton').click(function() {
    event.stopImmediatePropagation()
  // window.controller.abort();
  console.log('aborted ');
});

function loginModal(){
    $("#modallogin").css("display", "block");
}

function registerModal(){
    $("#modallogin").css("display", "none");
    $("#modalregister").css("display", "block");
}
async function loginUser(){
    const uName = $("#uname");
    const uPsw = $("#upsw");

    const pwTemp = sha256(uPsw.val());

    const loginjson = {
        "uname" : uName.val(),
        "upsw" : pwTemp
    }
    console.log(loginjson);

    let loginJson = JSON.stringify(loginjson)
    try {
        const response = await $.ajax({
            url: "/api/login",
            type: "POST",
            contentType: 'application/json',
            dataType: "json",
            data: loginJson,
        });
        console.log(response);
        if(response["status"]) {
            console.log(response["result_Data"]);
            await chatList();
        } else {
            console.log(response["result_Data"]);
        }
    } catch (error) {
        console.log(error);
    }
}

async function registerUser(){
    const uName = $("#registerUname");
    const uPsw = $("#registerPsw");
    const uPswCon = $("#registerPsw");

    if (uPsw === uPswCon){
        alert("비밀번호와 확인이 일치하지 않습니다.");
        return false;
    }

    const pwTemp = sha256(uPsw.val());

    const loginjson = {
        "uname" : uName.val(),
        "upsw" : pwTemp
    }
    console.log(loginjson);

    let loginJson = JSON.stringify(loginjson)
    try {
        const response = await $.ajax({
            url: "/api/register",
            type: "POST",
            contentType: 'application/json',
            dataType: "json",
            data: loginJson,
        });
        console.log(response);
        if(response["status"]) {
            console.log(response["result_Data"]);
            await chatList();
        } else {
            console.log(response["result_Data"]);
        }
    } catch (error) {
        console.log(error);
    }
}