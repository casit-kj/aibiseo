/**
 * 줄바꿈
 * @param text
 * @returns {*}
 */
const format = (text) => {
    return text.replace(/(?:\r\n|\r|\n)/g, "<br>");
};

/**
 * 상단 페이지 이동 메뉴바
 */
function headMenuBar() {
    const headMenuNav = $('#navHead');
    const headMenuUl = $('#head-menubar');
    const menuList = [{'url': '/', 'name': 'Home'},
        {'url': '/usermanage', 'name': 'User'},
        {'url': '/logpage', 'name': 'Log'},
        // {'url': '/upload', 'name': 'Upload'},
        {'url': '/chroma', 'name': 'chroma'}]
    console.log(menuList);
    let aImg = $("<a></a>").attr('href', '/')
        .css("float", "left");
    let ABImageImg = $("<img>").attr("src", "/static/images/AB_Logo.png")
        .attr("alt", "AB_Logo")
        .css("width", "300px")
        .css("height", "50px");
    aImg.append(ABImageImg);
    headMenuUl.append(aImg);
    menuList.forEach(function (data) {
        let liList = $("<li></li>");
        let aList = $("<a></a>").attr('href', data['url'])
            .text(data['name']);
        liList.append(aList);
        headMenuUl.append(liList);
    })
}


async function askGenAI() {
    const message_input = $('#message-input');
    const chBox = $('#toggle-slider').is(':checked');
    const spinner = $('.spinner');

    if ($('#messages .bwCom').length > 0) {
        // 'bwCom' 클래스를 가진 요소가 하나 이상 있을 경우, 'messages' div의 내용을 비웁니다.
        $('#messages').empty();
    }
    message_input.prop('disabled', true);
    message_input.css('height', '80px');
    message_input.focus();
    $(window).scrollTop(0); // 페이지의 맨 위로 스크롤
    let message = message_input.val();
    console.log(message);
    if (message.length > 0) {
        spinner.show();
        message_input.value = ``;
        previousChat = previousConversations();
        await messageBoxGen(message);
        if (chBox) {
            /** BWData 검색*/
            // bw_dataset = await requestBWData(message);
            // await searchResult(bw_dataset);
            // arrayDataset = bwDatasetToArray(bw_dataset);

            /**chromadb 검색*/
            chDataSet = await requestChromaData(message);
            await chromaSearchResult(chDataSet);
            arrayDataset = chDataSet['documents'][0];
        } else {
            arrayDataset = [];
        }
        await requestGenAI(message, arrayDataset, previousChat);
        await chatList();
        spinner.hide();
    }
    message_input.prop('disabled', false);
}

/**
 * 답변창 생성
 * @returns {Promise<void>}
 */
async function messageBoxGen(message) {
    const message_box = $('#messages');

    /**사용자 아이콘 및 질문 텍스트*/
    let divMessage = $("<div></div>").addClass("message");
    let divUser = $("<div></div>").addClass("user");
    divUser.append(user_image);
    divMessage.append(divUser);
    let divContent = $("<div></div>").addClass("content")
        .attr('id', 'user_temporary');
    divContent.append(format(formattedText(message)));
    divMessage.append(divContent);
    message_box.append(divMessage);

    /**사용자 대화창 자동 스크롤 기능 */
    await moveWindowScroll(message_box);


    /** GenAI 아이콘 및 답변창 */
    let divgMessage = $("<div></div>").addClass("message");
    let divgUser = $("<div></div>").addClass("user");
    divgUser.append(brainwise_image);
    divgMessage.append(divgUser);
    let divgContent = $("<div></div>").addClass("content")
        .attr('id', 'llm_temporary');
    let divgCursor = $("<div></div>").addClass("cursor");
    divgContent.append(divgCursor);
    divgMessage.append(divgContent);
    message_box.append(divgMessage);

    /**GenAI 대화창 자동 스크롤 기능 */
    await moveWindowScroll(message_box)

}

/**
 * 브레인와이즈 데이터 검색
 * @param {*} message
 */
async function requestBWData(message) {
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
        if (response['status']) {
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
async function requestGenAI(message, arrayBwDataset, previousChat) {
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
        "user_id": userId.val(),
        "dialog_id": dialogId.val(),
        "create_at": createAt.val()
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
        if (response['result']['status']) {
            const datatset = response['result'];
            dialogId.val(datatset.dialog_id);
            createAt.val(datatset.dialog_create_at);
            const questionId = $('#user_temporary');
            const answerId = $('#llm_temporary');
            answerId.empty();
            questionId.attr('id', "user_" + datatset.qna_id);
            answerId.attr('id', "llm_" + datatset.qna_id);
            $(`#llm_${datatset.qna_id}`).append(formattedText(datatset.answer));
            window.scrollTo(0, 0);
        } else {
            const answerId = $('#llm_temporary');
            answerId.empty();
            $(`#llm_temporary`).append(`죄송합니다! 문제가 발생했습니다. 다시 시도해 주시거나 페이지를 새로고침 해주세요. `);

            window.scrollTo(0, 0);
        }
    } catch (error) {
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
async function searchResult(dataset) {
    const resultbox = $('.resultbox');
    resultbox.empty();
    dataset.forEach(function (data) {
        let titlePageNoAName = data.owner_file + ' > ' + data.img_file;
        let divTitle = $("<div></div>").addClass("rcontent");
        let spanTitle = $("<span></span>").text(titlePageNoAName);
        divTitle.append(spanTitle);
        let divContent = $("<div></div>").addClass("search-content");
        let spanContent = $("<span></span>").text(data.content);
        divContent.append(spanContent);
        resultbox.append(divTitle, divContent);
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
async function new_conversation() {
    const addConvo = $('#add_convo');
    addConvo.empty();
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
function previousConversations() {
    let messages = [];
    // 모든 'content' 클래스를 가진 요소들의 텍스트를 반복하여 출력
    let qna_id = "";
    let conversation = null;
    $('.content').each(function () {
        let sentence = $(this).text();
        let elementId = $(this).attr('id');
        let pairElementId = elementId.split("_");
        let key = pairElementId[0].trim();
        let value = pairElementId[1];

        if (value != qna_id) {
            if (key == "user") {
                conversation = {};
                conversation.question = sentence;
                qna_id = value;
            }
            count = 1
        } else {
            if (key == "llm") {
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
async function chatList() {
    const insertChat = $('#listCating');
    const loginConversations = $('#login-conversations');
    const logoutConversations = $('#logout-conversations');
    const clearConversations = $('#clear-conversations');
    const messageInput = $('#message-input');
    const userConfig = $('#userConfig');

    let formData = insertChat.serializeArray();
    console.log(formData);
    try {
        const response = await $.ajax({
            url: "/api/chatList",
            type: "GET"
        });
        console.log(response);
        if (response["status"]) {
            const dataSet = response["result_Data"]["result"]["answer"];
            const loginConfirm = response['loginconfirm'];
            if (loginConfirm) {
                loginConversations.css("display", "none");
                logoutConversations.css("display", "block");
                clearConversations.css("display", "block");
                userConfig.css("display", "block");
                messageInput.prop('disabled', false);
                messageInput.attr('placeholder', '토글이 활성화 되면 질문에 검색자료를 첨부합니다.');
            } else {
                logoutConversations.css("display", "none");
                loginConversations.css("display", "block");
                clearConversations.css("display", "none");
                userConfig.css("display", "none");
                messageInput.prop('disabled', true);
                messageInput.attr('placeholder', '로그인후 이용해주세요');
            }
            if (dataSet !== "") {
                await chatListup(dataSet);
            }
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
async function chatListup(dataSet) {
    const addConvo = $('#add_convo');
    addConvo.empty();
    dataSet.forEach(function (data) {
        let idName = data[0];
        let cDateTime = data[2];
        let chatListTitle = data[4];
        // Date 객체 생성
        let date = new Date(cDateTime);

        // YYYY-MM-DDTHH:mm:ss.sssZ 형식으로 변환
        let isoString = date.toISOString();

        // YYYY-MM-DD HH:MM:SS 형식으로 변환
        let formattedDateString = isoString.slice(0, 19).replace("T", " ");
        console.log(formattedDateString);
        let divConvo = $("<div></div>").addClass("convo")
            .attr("id", idName);
        let divLeft = $("<div></div>").addClass("left");
        let iIcon = $("<i></i>").addClass("fa-regular fa-comments");
        let spanConvoTitle = $("<span></span>").addClass("convo-title")
            .text(chatListTitle)
            .attr('onclick', "loadChat('" + idName + "','" + formattedDateString + "')");
        let iShow = $("<i></i>").addClass("fa-regular fa-trash")
            .attr('onclick', "show_option('" + idName + "')")
            .attr('id', "conv-" + idName);
        let iDelete = $("<i></i>").addClass("fa-regular fa-check")
            .css("display", "none")
            .attr('onclick', "deleteChat('" + idName + "')")
            .attr('id', "yes-" + idName);
        let iHide = $("<i></i>").addClass("fa-regular fa-x")
            .css("display", "none")
            .attr('onclick', "hide_option('" + idName + "')")
            .attr('id', "not-" + idName);
        divLeft.append(iIcon, spanConvoTitle);
        divConvo.append(divLeft, iShow, iDelete, iHide);
        addConvo.append(divConvo);
    });
}

/**
 * 저장된 채팅 내역 데이터 불러오기
 * @returns {Promise<void>}
 * @param idName
 * @param cDateTime
 */
async function loadChat(idName, cDateTime) {
    const dialogId = $('#dialog_id');
    const message_box = $('#messages');
    const createAt = $('#create_at');

    dialogId.val(idName);
    createAt.val(cDateTime);

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
        if (response["status"]) {
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
async function deleteChat(idName) {
    const dialogId = $('#dialog_id');

    // 삭제하는 대화가 현재 진행중이 대화의 경우
    if (dialogId.val() === idName) {
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
        if (response["status"]) {
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
async function loadChatList(dataSet) {
    const message_box = $('#messages');
    message_box.empty();

    dataSet.forEach(function (data) {
        /**사용자 아이콘 및 질문 텍스트*/
        let divMessage = $("<div></div>").addClass("message");
        let divUser = $("<div></div>").addClass("user");
        divUser.append(user_image);
        divMessage.append(divUser);
        let divContent = $("<div></div>").addClass("content")
            .attr('id', 'user_' + data[0]);
        divContent.append(data[1]);
        divMessage.append(divContent);
        message_box.append(divMessage);


        /** GenAI 아이콘 */
        let divgMessage = $("<div></div>").addClass("message");
        let divgUser = $("<div></div>").addClass("user");
        divgUser.append(brainwise_image);
        divgMessage.append(divgUser);

        /** GenAI 답변 */
        let divgContent = $("<div></div>").addClass("content")
            .attr('id', 'llm_' + data[0]);
        let divgCursor = $("<div></div>").addClass("cursor");
        divgContent.append(formattedText(data[2]),divgCursor);
        divgMessage.append(divgContent);
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
        if (response["status"]) {
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
async function show_option(conversation_id) {
    $(`#conv-${conversation_id}`).hide();
    $(`#yes-${conversation_id}`).show();
    $(`#not-${conversation_id}`).show();
}

/**
 * 대화 삭제 취소
 * @param conversation_id
 * @returns {Promise<void>}
 */
async function hide_option(conversation_id) {
    $(`#conv-${conversation_id}`).show();
    $(`#yes-${conversation_id}`).hide();
    $(`#not-${conversation_id}`).hide();
}


/**
 * 대화 전체 삭제 확인
 * @returns {Promise<void>}
 */
async function showClear() {
    $("#clear-conversations").hide();
    $("#confirm-conversations").show();
}

/**
 * 데이터 전체 삭제 취소
 * @returns {Promise<void>}
 */
async function hideClear() {
    $("#clear-conversations").show();
    $("#confirm-conversations").hide();
}

/**
 * 초기화면 출력
 */
function wellcomeBox() {
    const message_box = $('#messages');
    let bwComDiv = $("<div></div>").addClass("bwCom");
    let bwComBoxDiv = $("<div></div>").addClass("bwCom-Box");
    let bwImageImg = $("<img>").attr("src", "/static/images/ailogo.png")
        .attr("alt", "brainwiseWellComeimage")
        .css("border-radius", "20px")
        .css("margin-bottom", "5px")
        .css("width", "80%")
        .css("height", "80%");
    bwComBoxDiv.append(bwImageImg);
    bwComBoxDiv.append("<br>무엇을 도와드릴까요?");
    bwComDiv.append(bwComBoxDiv);
    message_box.append(bwComDiv);
}

function formattedText(message) {
    return message.replace(/\n/g, "<br>");
}


/**
 * 로그인창 모달 열기
 */
function loginModal() {
    $("#uname").val('');
    $("#upsw").val('');
    $("#modallogin").css("display", "block");
}

/**
 * 회원가입창 모달 열기
 */
function registerModal() {
    $("#modallogin").css("display", "none");
    $("#modalregister").css("display", "block");
}

/**
 * 사용자 로그인
 * @returns {Promise<boolean>}
 */
async function loginUser(pageConfirm) {
    const uName = $("#uname");
    const uPsw = $("#upsw");
    const pwTemp = sha256(uPsw.val());
    if (uName.length === 0 || uPsw.length === 0) {
        return false
    }
    const loginjson = {
        "uname": uName.val(),
        "upsw": pwTemp
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
        if (response["status"]) {
            console.log(response["result_Data"]);
            $("#modallogin").css("display", "none");
            if (pageConfirm === "index") {
                await chatList();
            } else if (pageConfirm === "usermanage") {
                await userTable();
            } else if(pageConfirm === "log") {
                await dirPathLog();
            } else if(pageConfirm === "upload") {
                await upLoadPage();
            }
        } else {
            console.log(response["result_Data"]);
            alert(response["result_Data"]['result']['answer']);
        }
    } catch (error) {
        console.log(error);
    }
}

/**
 * 사용자 회원가입
 * @returns {Promise<boolean>}
 */
async function registerUser() {
    const uName = $("#registerUname").val();
    const uPsw = $("#registerPsw").val();
    const uPswCon = $("#registerPswCon").val();
    console.log(uName.length);
    //아이디 길이
    if (uName.length < 4 || uName.length > 16) {
        alert('아이디는 4자 이상 16자 이하여야 합니다.');
        return false
    }

    // 아이디 특수문자 확인
    if (!/^[a-zA-Z0-9_]*$/.test(uName)) {
        alert('특수문자는 사용할 수 없습니다.');
        return false
    }

    // // 비밀번호 길이 제한
    // if(uPsw.length < 8) {
    //     alert("비밀번호는 8자 이상이어야 합니다.");
    //     return false;
    // }
    // 비밀번호확인
    if (uPsw !== uPswCon) {
        alert("비밀번호와 확인이 일치하지 않습니다.");
        return false;
    }
    // // 비밀번호 복잡성 (문자, 숫자, 특수문자 혼합)
    // const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;
    // if(!pattern.test(uPsw)) {
    //     alert("비밀번호는 대소문자, 숫자, 특수문자를 모두 포함해야 합니다.");
    //     return false;
    // }
    //
    // // 비밀번호 사용자 정보 포함 여부 확인
    // if(uPsw.toLowerCase().includes(uName.toLowerCase())) {
    //     alert("비밀번호에 사용자 이름을 포함할 수 없습니다.");
    //     return false;
    // }
    //
    // // 연속 문자 제한 (예시로 3개 이상의 연속된 문자 제한)
    // if(/(\w)\1\1/.test(uPsw)) {
    //     alert("비밀번호에 3개 이상의 연속된 문자를 사용할 수 없습니다.");
    //     return false;
    // }


    const pwTemp = sha256(uPsw);

    const loginjson = {
        "uname": uName,
        "upsw": pwTemp
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
        if (response["status"]) {
            console.log(response["result_Data"]);
            $("#modallogin").css("display", "none");
            $("#modalregister").css("display", "none");
            alert("아이디가 생성되었습니다.");

        } else {
            console.log(response["result_Data"]);
            alert("중복된 아이디이거나 DB 오류 입니다.");
        }
    } catch (error) {
        console.log(error);
        alert(error);
    }
    $("#registerUname").val("");
    $("#registerPsw").val("");
    $("#registerPswCon").val("");
}

/**
 * 사용자 로그아웃
 * @returns {Promise<void>}
 */
async function logoutUser(pageConfirm) {
    try {
        const response = await $.ajax({
            url: "/api/logout",
            type: "GET"
        });
        console.log(response);
        if (response["status"]) {
            console.log(response["result_Data"]);
        } else {
            console.log(response["result_Data"]);
        }

    } catch (error) {
        console.log(error);
    }
    if (pageConfirm === "index") {
        await chatList();
        await new_conversation();
    } else if (pageConfirm === "usermanage") {
        await userTable();
    } else {
        await dirPathLog();
    }

}

/**
 * 회원정보 수정창 열기
 */
function userConfig() {
    $("#modal-user-config").css("display", "block");
}

/**
 * 회원정보 업데이트
 * @returns {Promise<boolean>}
 */
async function updateUser() {
    const uName = $("#user_id").val();
    const uPsw = $("#updatePsw").val();
    const uPswCon = $("#updatePswCon").val();


    // // 비밀번호 길이 제한
    // if(uPsw.length < 8) {
    //     alert("비밀번호는 8자 이상이어야 합니다.");
    //     return false;
    // }
    // 비밀번호확인
    if (uPsw !== uPswCon) {
        alert("비밀번호와 확인이 일치하지 않습니다.");
        return false;
    }
    // // 비밀번호 복잡성 (문자, 숫자, 특수문자 혼합)
    // const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;
    // if(!pattern.test(uPsw)) {
    //     alert("비밀번호는 대소문자, 숫자, 특수문자를 모두 포함해야 합니다.");
    //     return false;
    // }
    //
    // // 비밀번호 사용자 정보 포함 여부 확인
    // if(uPsw.toLowerCase().includes(uName.toLowerCase())) {
    //     alert("비밀번호에 사용자 이름을 포함할 수 없습니다.");
    //     return false;
    // }
    //
    // // 연속 문자 제한 (예시로 3개 이상의 연속된 문자 제한)
    // if(/(\w)\1\1/.test(uPsw)) {
    //     alert("비밀번호에 3개 이상의 연속된 문자를 사용할 수 없습니다.");
    //     return false;
    // }


    const pwTemp = sha256(uPsw);

    const updatejson = {
        "upsw": pwTemp,
        "uname": uName
    }
    console.log(updatejson);

    let updateJson = JSON.stringify(updatejson)
    try {
        const response = await $.ajax({
            url: "/api/updateUser",
            type: "POST",
            contentType: 'application/json',
            dataType: "json",
            data: updateJson,
        });
        console.log(response);
        if (response["status"]) {
            console.log(response["result_Data"]);
            $("#modal-user-config").css("display", "none");
            alert("회원정보가 수정되었습니다.");

        } else {
            console.log(response["result_Data"]);
            alert("사용하시던 비밀번호이거나 DB 오류 입니다.");
        }
    } catch (error) {
        console.log(error);
        alert(error);
    }
    $("#updatePsw").val("");
    $("#updatePswCon").val("");
}

/**
 * 회원삭제 확인
 * @returns {Promise<void>}
 */
async function showDeleteUser() {
    $("#configButton").hide();
    $("#confirmDeleteButton").show();
}

/**
 * 회원삭제 확인 닫기
 * @returns {Promise<void>}
 */
async function hideDeleteUser() {
    $("#configButton").show();
    $("#confirmDeleteButton").hide();
}

/**
 * 사용자 삭제
 * @returns {Promise<void>}
 */
async function deleteUser() {

    try {
        const response = await $.ajax({
            url: "/api/deleteUser",
            type: "GET"
        });
        console.log(response);
        if (response["status"]) {
            console.log(response["result_Data"]);
            await logoutUser('index');
            $("#modal-user-config").css("display", "none");
            alert("회원이 삭제 되었습니다.");
        } else {
            console.log(response["result_Data"]);
        }
    } catch (error) {
        console.log(error);
    }
}

/**
 * 사용자테이블 데이터 호출
 * @returns {Promise<void>}
 */
async function userTable() {
    const loginConversations = $('#login-conversations');
    const logoutConversations = $('#logout-conversations');
    const userTable = $('#user-table-body');
    try {
        const response = await $.ajax({
            url: "/api/userTable",
            type: "GET"
        });
        console.log(response);
        if (response["status"]) {
            const dataSet = response["result_Data"]["result"]["answer"];
            const loginConfirm = response['loginconfirm'];
            if (loginConfirm) {
                if (response["result_Data"]["result"]["code"] === '201'){
                    loginConversations.css("display", "none");
                    logoutConversations.css("display", "block");
                    userTable.empty();
                    alert('관리자로 로그인해 주세요');
                } else {
                    loginConversations.css("display", "none");
                    logoutConversations.css("display", "block");
                }
            } else {
                logoutConversations.css("display", "none");
                loginConversations.css("display", "block");
                userTable.empty();
            }
            if (dataSet !== "") {
                await userTableBody(dataSet);
            }
        } else {
            console.log(response["result_Data"]);
        }
    } catch (error) {
        console.log(error);
    }
}

/**
 * 사용자 테이블 출력
 * @param dataSet
 * @returns {Promise<void>}
 */
async function userTableBody(dataSet) {
    const userTable = $('#user-table-body');

    userTable.empty();
    dataSet.forEach(function (data, index) {
        let trU = $("<tr></tr>");
        let tdIdex = $("<td></td>").addClass("noBorder")
            .text(index + 1);
        let tdName = $("<td></td>").addClass("noBorder")
            .text(data[0]);
        let tdButton = $("<td></td>").addClass("noBorder");
        let buttonUpdate = $("<button></button>").addClass("button-manage user-update")
            .attr('id', 'buttonUpdate' + index)
            .text('수정')
            .attr('onclick', "userUpdateModal('" + data[0] + "');");

        let buttonDeleteCheckConfirm = $("<button></button>").addClass("button-manage user-delete")
            .attr('id', 'buttonCheckConfirm' + index)
            .text('삭제')
            .attr('onclick', "deleteCheckConfirm('" + index + "');");

        let buttonCheckCancle = $("<button></button>").addClass("button-manage user-delete")
            .css('display', 'none')
            .attr('id', 'buttonCheckCancle' + index)
            .text('취소')
            .attr('onclick', "checkCancle('" + index + "');");

        let buttonDelete = $("<button></button>").addClass("button-manage user-update")
            .css('display', 'none')
            .attr('id', 'buttonDelete' + index)
            .text('확인')
            .attr('onclick', "targetUserDelete('" + data[0] + "');");

        let spanConfirm = $("<span></span>").text("계정을 삭제하시겠습니까?")
            .attr('id', 'spanConfirm' + index)
            .css('display', 'none');

        tdButton.append(spanConfirm, buttonUpdate, buttonDeleteCheckConfirm, buttonCheckCancle, buttonDelete);
        trU.append(tdIdex, tdName, tdButton);
        userTable.append(trU);
    })
}

/**
 * 유저 데이터 변경
 * @param username
 */
function userUpdateModal(username) {
    $('#user_id').val(username);
    $('#modal-user-config').show();

}

/**
 * 유저 데이터 삭제 확인
 * @param index
 */
function deleteCheckConfirm(index) {
    $('#buttonUpdate' + index).hide();
    $('#buttonCheckConfirm' + index).hide();
    $('#buttonCheckCancle' + index).show();
    $('#buttonDelete' + index).show();
    $('#spanConfirm' + index).show();
}

/**
 * 유저데이터 삭제 취소
 * @param index
 */
function checkCancle(index) {
    $('#buttonUpdate' + index).show();
    $('#buttonCheckConfirm' + index).show();
    $('#buttonCheckCancle' + index).hide();
    $('#buttonDelete' + index).hide();
    $('#spanConfirm' + index).hide();
}

/**
 * 유저데이터 삭제
 * @param uName
 */
async function targetUserDelete(uName) {
    const unamejson = {
        "uName": uName,
    }

    console.log(unamejson);

    let uNameJson = JSON.stringify(unamejson)
    try {
        const response = await $.ajax({
            url: "/api/targetDelete",
            type: "POST",
            contentType: 'application/json',
            dataType: "json",
            data: uNameJson,
        });
        console.log(response);
        if (response["status"]) {
            console.log(response["result_Data"]);
            await userTable();
        } else {
            console.log(response["result_Data"]);
            alert(response["result_Data"]['result']['answer']);
        }
    } catch (error) {
        console.log(error);
    }
}

/**
 * 로그파일 목록 불러오기
 * @returns {Promise<void>}
 */
async function dirPathLog() {
    const loginConversations = $('#login-conversations');
    const logoutConversations = $('#logout-conversations');
    const userConfig = $('#userConfig');
    const addLog = $('#add_log');
    const LogFileText = $('#logfilePrintBox');
    const logfileNameBox = $('#logfileNameBox');
    logfileNameBox.empty();
    LogFileText.empty();
    addLog.empty();
    try {
        const response = await $.ajax({
            url: "/api/dirPathLog",
            type: "GET"
        });
        console.log(response);
        if (response["status"]) {
            const dataSet = response["result_Data"]["result"]["answer"];
            const loginConfirm = response['loginconfirm'];
            if (loginConfirm) {
                if (response["result_Data"]["result"]["code"] === '201'){
                    loginConversations.css("display", "none");
                    logoutConversations.css("display", "block");
                    await logListup(dataSet);
                    alert('관리자로 로그인해 주세요');
                } else{
                    loginConversations.css("display", "none");
                    logoutConversations.css("display", "block");
                    userConfig.css("display", "block");
                    await logListup(dataSet);
                }

            } else {
                logoutConversations.css("display", "none");
                loginConversations.css("display", "block");
                userConfig.css("display", "none");
            }
        } else {
            console.log(response["result_Data"]);
            logoutConversations.css("display", "none");
            loginConversations.css("display", "block");
            userConfig.css("display", "none");
        }
    } catch (error) {
        console.log(error);
        logoutConversations.css("display", "none");
        loginConversations.css("display", "block");
        userConfig.css("display", "none");
    }
}

/**
 * 로그파일 출력
 * @param dataSet
 * @returns {Promise<void>}
 */
async function logListup(dataSet) {
    const addLog = $('#add_log');
    const LogFileText = $('#logfilePrintBox');
    LogFileText.empty();
    addLog.empty();
    if (dataSet!==''){
        dataSet.forEach(function (data) {
            let LogTitle = data;
            // Date 객체 생성
            let divConvo = $("<div></div>").addClass("convo");
            let divLeft = $("<div></div>").addClass("left");
            let iIcon = $("<i></i>").addClass("fa-regular fa-file-lines");
            let spanConvoTitle = $("<span></span>").addClass("convo-title")
                .attr('onclick', "loadLogFile('" + LogTitle + "')")
                .text(LogTitle);
            divLeft.append(iIcon, spanConvoTitle);
            divConvo.append(divLeft);
            addLog.append(divConvo);
        });
    }

}

/**
 * 로그파일 내용 불러오기
 * @param fileName
 * @returns {Promise<void>}
 */
async function loadLogFile(fileName){
        const fileNamejson = {
        "fileName": fileName,
    }

    console.log(fileNamejson);

    let fileNameJson = JSON.stringify(fileNamejson)
    try {
        const response = await $.ajax({
            url: "/api/loadLogFile",
            type: "POST",
            contentType: 'application/json',
            dataType: "json",
            data: fileNameJson,
        });
        console.log(response);
        if (response["status"]) {
            const dataSet = response["result_Data"]["result"]["answer"];
            console.log(response["result_Data"]);
            await logFileListup(dataSet,fileName)
        } else {
            console.log(response["result_Data"]);
        }
    } catch (error) {
        console.log(error);
    }
}

/**
 * 로그파일 내용 출력
 * @param dataSet
 * @param fileName
 * @returns {Promise<void>}
 */
async function logFileListup(dataSet,fileName) {
    console.log(fileName);
    const LogFileText = $('#logfilePrintBox');
    const logfileNameBox = $('#logfileNameBox');
    LogFileText.empty();
    logfileNameBox.empty();
    LogFileText.text(dataSet);
    logfileNameBox.text(fileName);
    LogFileText.scrollTop(LogFileText[0].scrollHeight)
}

/**
 * 모델선택 드롭다운
 * @param model
 */
function modelSelect(model){
    const modelSelectButton = $('#modelSelectButton');
    if(model === ''){
        modelSelectButton.text('모델을 선택해주세요');
    } else{
        modelSelectButton.text(model);
    }
}

/**
 * 파일 업로드
 * @returns {Promise<void>}
 */
async function fileUpload() {
    event.preventDefault(); // 폼의 기본 제출 동작 방지
    const formData = new FormData($("#uploadForm")[0]);
    console.log(formData);
    console.log($("#uploadForm"));
    try {
        const response = await $.ajax({
            url: "/api/upload",
            type: "POST",
            processData: false, // FormData 객체를 사용할 때 필수
            contentType: false, // FormData 객체를 사용할 때 필수
            data: formData,
            dataType: "json", // 서버로부터 JSON 응답을 기대
        });
        console.log("File metadata:", response);
    } catch (error) {
        console.error("Error:", error);
    }
}

/**
 * 업로드페이지 로드(세션확인 및 유지)
 * @returns {Promise<void>}
 */
async function upLoadPage(){
    const loginConversations = $('#login-conversations');
    const logoutConversations = $('#logout-conversations');
    try {
        const response = await $.ajax({
            url: "/api/upLoadPage",
            type: "GET"
        });
        console.log(response);
        const loginConfirm = response['loginconfirm'];
        if (loginConfirm) {
            loginConversations.css("display", "none");
            logoutConversations.css("display", "block");
        } else {
            logoutConversations.css("display", "none");
            loginConversations.css("display", "block");
        }
    } catch (error) {
        console.log(error);
    }
}

/**
 * 크로마DB데이터 입력
 * @returns {Promise<void>}
 */
async function chromaInsert() {
    event.preventDefault(); // 폼의 기본 제출 동작 방지
    const formData = new FormData($("#chromaForm")[0]);
    console.log(formData);
    console.log($("#chromaForm"));
    try {
        const response = await $.ajax({
            url: "/api/chromaInsert",
            type: "POST",
            processData: false, // FormData 객체를 사용할 때 필수
            contentType: false, // FormData 객체를 사용할 때 필수
            data: formData,
            dataType: "json", // 서버로부터 JSON 응답을 기대
        });
        console.log("File metadata:", response);
    } catch (error) {
        console.error("Error:", error);
    }
}

/**
 * 크로마 쿼리 테스트
 * @returns {Promise<void>}
 */
async function chromaQuery() {
    event.preventDefault(); // 폼의 기본 제출 동작 방지
    const formData = new FormData($("#chromaForm")[0]);
    console.log(formData);
    console.log($("#chromaForm"));
    try {
        const response = await $.ajax({
            url: "/api/chromaQuery",
            type: "POST",
            processData: false, // FormData 객체를 사용할 때 필수
            contentType: false, // FormData 객체를 사용할 때 필수
            data: formData,
            dataType: "json", // 서버로부터 JSON 응답을 기대
        });
        console.log("File metadata:", response);
    } catch (error) {
        console.error("Error:", error);
    }
}

/**
 * Chroma 검색결과
 * @param message
 * @returns {Promise<*>}
 */
async function requestChromaData(message) {
    const answerBox = $('#llm_temporary');
    answerBox.empty();

    answerBox.append("Chroma 참고자료를 수집중입니다....")

    let messageJson =  JSON.stringify({
        "message":format(message)
    })

    try {
        const response = await $.ajax({
            type: "POST",
            url: '/api/ChromaData',
            contentType: 'application/json',
            dataType: "json",
            data: messageJson,
        });
        console.log(response);
        if (response['status']) {
            return response['result'];
        } else {
        }
    } catch (error) {
        console.log(error);
    }
}

/**
 * Chroma 검색결과 출력
 * @param chdataset
 */
async function chromaSearchResult(chdataset) {
    const resultbox = $('.resultbox');
    resultbox.empty();
    console.log(chdataset['documents'][0].length);
    let dataset = [];
    for (let i = 0; i < chdataset['documents'][0].length; i++){
        dataset.push({"content":chdataset['documents'][0][i],
            'name':chdataset['metadatas'][0][i]['name'],
            'writer':chdataset['metadatas'][0][i]['writer']
        });
    }
    console.log(dataset);
    dataset.forEach(function (data) {
        let titlePageNoAName = data.name + ' > ' + data.writer;
        let divTitle = $("<div></div>").addClass("rcontent");
        let spanTitle = $("<span></span>").text(titlePageNoAName);
        divTitle.append(spanTitle);
        let divContent = $("<div></div>").addClass("search-content");
        let spanContent = $("<span></span>").text(data.content);
        divContent.append(spanContent);
        resultbox.append(divTitle, divContent);
    });
}