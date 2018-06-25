var _d = new Date();
var _year = (_d.getFullYear()).toString();
var _month = (_d.getMonth() + 1);
var _day = (_d.getDate()).toString();

var _monthdays = new Array(31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31);
var _weekdays = new Array('일', '월', '화', '수', '목', '금', '토');
var _dayOfWeekIndex = new Date(_year, _month - 1, 1).getDay();

var _dialogList;
var _dialog;
var _dialogDetail;
var _dialogForm;
var _detailData;

var _id;
var _startDate;

$(document).ready(function () {
    // page UI init
    init();
});

function init() {
    dialoginit();
    calendarinit();
    bind();
}

function dialoginit() {
    //일정 세부사항 정보
    _dialogDetail = $("#dialog-detail").dialog({
        closeText: "",
        modal: true,
        autoOpen: false,
        height: 500,
        width: 500,
        buttons: {
            닫기: function () {
                $(this).dialog('close');
            },
            삭제: function () {
                fnDeleteAppointment();
                init();
                $(this).dialog('close');
                $('#dialog-list').dialog('close');
            },
            수정: function () {
                fnUpdateAppointment();
                init();
                $(this).dialog('close');
                $('#dialog-list').dialog('close');
            }
        }
    });

    //dialog Input form
    _dialog = $("#dialog-insert-form").dialog({
        closeText: "",
        autoOpen: false,
        height: 400,
        width: 350,
        buttons: {
            OK: function () {
                var dateValue = $('#insertDateStart').val();
                fnAjaxPost();
                //table init 실행.
                fnDialogInit(dateValue);
                _dialog.dialog("close");
            },
            Cancel: function () {
                _dialog.dialog("close");
                //TODO :: form 초기화 시켜줘야함.
            }
        }
    });

    fnInsertFormInit();
    //일정 List 
    _dialogList = $("#dialog-list").dialog({
        closeText: "",
        autoOpen: false,
        height: 400,
        width: 500
    });

}

//데이터 추가 폼
function fnInsertFormInit(){
    var html = '';
    html += '<label for="subject">제목</label>';
    html += '<input type="text" name="subject" id="insertSubject" required>';
    html += '<div class="w3-row">';
    html += '<label> 분류 </label>';
    html += '<select name="category" id="insertCategory">';
    html +=     '<option value="출장">출장</option>';
    html +=     '<option value="회의">회의</option>';
    html +=     '<option value="계약">계약</option>';
    html +=     '<option value="교육">교육</option>';
    html +=     '<option value="기타">기타</option>';
    html += '</select>';
    html += '</div>';
    html += '<div class="w3-row">';
    html += '</br>';
    html +=    '<label for="dateStart" class="w3-left">시작</label>';
    html +=    '<input class="datePickSelect w3-col m5" type="text" id="insertDateStart" required>';
    html +=    '<input class="timepicker w3-col m5" type="text"  id="insertDateStartTime">';
    html += '</div>'
    html += '</br>';
    html += '<div class="w3-row">'
    html +=    '<label for="dateEnd" class="w3-left">종료</label>';
    html +=    '<input class="datePickSelect w3-col m5" type="text" id="insertDateEnd" required>';
    html +=    '<input class="timepicker w3-col m5" type="text" id="insertDateEndTime">';
    html += '</div>'
    html += '</br>';
    html +=    '<label for="description">상세내용</label>';
    html +=   '<textarea id="insertDescription" ></textarea>';

    $('#dialog-insert-form').html(html);
}

function calendarinit() {
    $("#year").text(_year);
    $("#month").text(_month);
    //요일 표시
    $("#weekdays").html(function () {
        var str = '';
        for (var i = 0; i < _weekdays.length; i++) {
            str += '<li>' + _weekdays[i] + '</li>'
        }
        return str;
    });

    //윤년계산
    if (_year % 4 == 0 && _year % 100 !== 0 || _year % 400 == 0) {
        _monthdays[1] = 29;
    }

    fnDaysPrint(_month);

    // $("#dateStartTime").val("17:00");
    // $("#dateEndTime").val("18:00");
    $('.timepicker').timepicker({
        timeFormat: 'H:mm',
        interval: 60,
        startTime: '00:00',
        defaultTime: '17:00',
        dynamic: false,
        scrollbar: true,
        zindex: 2000
    });

    fndatefickerinit();
}

function fndatefickerinit(){

    $(".datePickSelect").datepicker();
    $(".datePickSelect").datepicker("option", "dateFormat", "yymmdd");

    $("#dateEndTime").val('18:00');
}

function bind() {
    $(".prev").unbind("click").bind("click", function () {
        _month--;
        if (_month < 1) {
            _year--;
            _month = 12;
        }
        $("#month").text(_month);
        init();
    });

    $(".next").unbind("click").bind("click", function () {
        _month++;
        if (_month > 12) {
            _year++;
            _month = 1;
        }
        $("#month").text(_month);
        init();
    });

    //날짜 클릭시 event.
    $("#days li").unbind("click").bind("click", function () {
        var dayOfWeekIndex = new Date(_year, _month - 1, 1).getDay();
        var monthValue = fnLeadingZeros(_month, 2).toString();
        var daysValue = fnLeadingZeros(($(this).index() - (dayOfWeekIndex - 1)), 2).toString();
        var dateValue = _year + monthValue + daysValue;

        _startDate = dateValue;
        $('#dateStart').val(dateValue);
        $('#dateEnd').val(dateValue);

        fnDialogInit(dateValue);
        _dialogList.dialog("open");
    })

    $(".draggable").draggable({
        helper: "clone"
    });

    $(".droppable").droppable({
        accept: '.draggable',
        classes: {
            "ui-droppable-hover": "ui-state-highlight"
        },
        drop: function (event, ui) {
            var monthValue = fnLeadingZeros(_month, 2).toString();
            var dayOfWeekIndex = new Date(_year, _month - 1, 1).getDay();
            var daysValue = fnLeadingZeros(($(this).index() - (dayOfWeekIndex - 1)), 2).toString();
            var dateValue = _year + monthValue + daysValue;
            $('#insertDateStart').val(dateValue);
            $('#insertDateEnd').val(dateValue);
            $('#insertCategory').val(ui.draggable[0].textContent);
            $('#insertDecription').val(ui.draggable[0].textContent);
            $('#insertSubject').val(ui.draggable[0].textContent);
            //TODO :: enddatetime default 설정해줘야한다.
            _dialog.dialog("open");
            // fnAjaxPost();
        }
    });

    $( "#draggable" ).draggable();
    $( "#droppable").droppable({
        classes: {
            "ui-droppable-hover": "ui-state-hover"
        },
        drop: function( event, ui ) {
        $( this )
            .addClass( "ui-state-highlight" )
        }
    })

    _dialogForm = _dialog.find("form").on("submit", function (event) {
        event.preventDefault();
        fnAjaxPost();
    });

    
    $('.daysappoint').unbind("click").bind("click", function(event) {
        event.stopPropagation();
        var date = $(this).attr('data-date');
        var id = $(this).attr('data-id');
        fnGetValueUsingId(date,id);
    })
   
}

//dayOfWeek 0 = 일요일 6 = 토요일
function fnDaysPrint(input_month) {
    fnGetAppointment();
    var monthValue = fnLeadingZeros(_month, 2).toString();
    var fullDays = _year + monthValue;;
    $("#days").html(function () {
        var str = fnGetFirstDay();
        for (var i = 1; i < _monthdays[input_month - 1] + 1; i++) {
            //TODO :: days span class 정의해야함.
            if (i == _day && (input_month == (_month + 1)) && (_year == _d.getFullYear())) {
                str += '<li class="droppable "><span class="active">' + i + '</span></li>';
            } else {
                str += '<li class="droppable" data-date="'+(fullDays+fnLeadingZeros(i,2))+'"><p>' + i + '</p></li>'
            }
        }
        return str;
    });
}

//1일이 무슨 요일인지 설정.
function fnGetFirstDay() {
    var result = '';
    var dayOfWeekIndex = new Date(_year, _month - 1, 1).getDay();
    for (var i = 0; i < dayOfWeekIndex; i++) {
        result += '<li><p>&nbsp</p></li>'
    }
    return result;
}

/*
 * 자릿수 맞춰주기
 */
function fnLeadingZeros(n, digits) {
    var zero = '';
    n = n.toString();

    if (n.length < digits) {
        for (var i = 0; i < digits - n.length; i++)
            zero += '0';
    }
    return zero + n;
}


//ul days 일정 가져오기
function fnAjaxPost() {
    //TODO :: 여기해야한다.
    var data = {
        subject: $('#insertSubject').val(),
        dateStart: $('#insertDateStart').val(),
        dateStartTime: $('#insertDateStartTime').val(),
        dateEnd: $('#insertDateEnd').val(),
        dateEndTime: $('#insertDateEndTime').val(),
        description: $('#insertDescription').val(),
        category: $('#insertCategory').val()
    }

    $.ajax({
        url: "/api/calendar",
        data: data,
        type: "post",
        success: function (result) {
            init();
        },
        error: function (err) {
            console.log(err);
        }
    });
}


function fnGetAppointment() {
    var monthValue = fnLeadingZeros(_month, 2).toString();
    var data = {
        "month": monthValue,
        "year": _year
    }
    $.ajax({
        url: "/api/calendar/appointment",
        type: "post",
        data: data,
        success: function (result) {
            if (result.resCode == 'false') {
                return;
            }

            for (var j = 0; j < result.appointment.length; j++) {
                for (var i = 0; i < result.appointment[j].length; i++) {
                    // var appointDate = result.appointment[j][i].dateStart;
                    // var appointSubject = result.appointment[j][i].subject;
                    // var appointEndDate = result.appointment[j][i].dateEnd;
                    // var id = result.appointment[j][i].id
                    fnInsertSpan(result.appointment[j][i]);
                }
            }
            bind();
        },
        error: function (err) {
            console.log(err);
        }
    });
}

//ID를 이용해 data를 가져온다
function fnGetValueUsingId(date, id) {
    var data = {
        date: date,
        id: id
    }

    $.ajax({
        url: '/api/calendar/getValueById',
        type: "post",
        data: data,
        success: function (result) {
            if (result.resCode == 'success') {
                setDetailDialog(result.reply);
            }
        },
        error: function (err) {
            console.log(err);
        }
    });
}

//id를 이용해서 data를 삭제한다.
function fnDeleteAppointment() {
    var data = {
        id: _id,
        startDate: _startDate
    }
    $.ajax({
        url: '/api/calendar/delete',
        type: "post",
        data: data,
        success: function (result) {
            console.log(result);
        },
        error: function (err) {
            console.log(err);
        }
    });
}


//startDate에 따라서 data를 가져온다.
function fnDialogInit(dateValue) {
    var data = {
        "startDate": dateValue
    };

    $.ajax({
        url: '/api/calendar/specificDate',
        type: "post",
        data: data,
        success: function (result) {
            fnTableInit(result.resCode, result.replyData);
        },
        error: function (err) {
            console.log(err);
        }
    });
}

//id를 이용해서 일정을 수정한다.
function fnUpdateAppointment() {
    var data = {
        subject: $('#detailSubject').val(),
        dateStart: $('#detailDateStart').val(),
        dateEnd: $('#detailDateEnd').val(),
        dateStartTime: $('#detailDateStartTime').val(),
        dateEndTime: $('#detailDateEndTime').val(),
        description: $('#detailDescription').val(),
        id : _id,
        category: $('#detailCategory').val()
    };
    $.ajax({
        url: '/api/calendar/update',
        type: "post",
        data: data,
        error: function (err) {
            console.log(err);
        }
    });
}


//Calendar에 받은 date를 기반으로 li를 찾아 button을 삽입한다.
function fnInsertSpan(appointment) {
    var date = appointment.dateStart.substr(6, 2);
    var enddate = appointment.dateEnd.substr(6,2);
    var number = new Array();

    for(var i = parseInt(date) ; i <= enddate ; i++) {
        number.push(i);
    }

    var dayOfWeekIndex = new Date(_year, _month - 1, 1).getDay();
    dayOfWeekIndex = parseInt(dayOfWeekIndex);
    //startDate의 liIndex
    var liIndex = dayOfWeekIndex + parseInt(date);
    // console.log('liIndex : ' + liIndex);
    var liWidth = $('#days li').outerWidth();
    var btnWidth = liWidth;
    var html = '';


    if (appointment.category == '회의') {
        html += '<span class="w3-pink daysappoint" data-date = ' + appointment.dateStart + ' data-id = ' + appointment.id + '  style="width: '
    } else if (appointment.category == '출장') {
        html += '<span class="w3-indigo daysappoint" data-date = ' + appointment.dateStart + ' data-id = ' + appointment.id + ' style="width: '
    } else if (appointment.category == '연차') {
        html += '<span class="w3-blue-grey daysappoint" data-date = ' + appointment.dateStart + ' data-id = ' + appointment.id + ' style="width: '
    } else if (appointment.category == '계약') {
        html += '<span class="w3-deep-orange daysappoint" data-date = ' + appointment.dateStart + ' data-id = ' + appointment.id + ' style="width: '
    } else if (appointment.category == '교육') {
        html += '<span class="w3-purple daysappoint" data-date = ' + appointment.dateStart + ' data-id = ' + appointment.id + ' style="width: '
    } else {
        html += '<span class="w3-green daysappoint" data-date = ' + appointment.dateStart + ' data-id = ' + appointment.id + ' style="width: '
    }

    html += btnWidth + 'px;">[' + appointment.category + ']' + appointment.subject + '</span>';
    // for(var i = liIndex ; number.length ;)
    for(var i = 0 ; i < number.length ; i++) {
        $("#days li:nth-child(" + (liIndex + i) + ")").append(html);
    }

}

//클릭한 날의 토요일 index구하기
function fnGetSaturday(appointDate, appointEndDate, liIndex, fnGetSaturdayIndex) {
    var saturdayIndex;
    var result = 'notOver';

    if (liIndex <= 7) {
        saturdayIndex = 7;
    } else if (liIndex > 7 && liIndex <= 14) {
        saturdayIndex = 14;
    } else if (liIndex > 14 && liIndex <= 21) {
        saturdayIndex = 21;
    } else if (liIndex > 21 && liIndex <= 28) {
        saturdayIndex = 28;
    } else if (liIndex > 28 && liIndex <= 35) {
        saturdayIndex = 35;
    } else {}

    // callback 함수
    fnGetSaturdayIndex(saturdayIndex);
    if ((appointEndDate - appointDate) > (saturdayIndex - liIndex)) {
        result = 'over'
    } else {
        result = 'notOver'
    }

    return result;
}


//data가있다면 출력 없다면 없음메세지 출력
function fnTableInit(resCode, replyData) {
    var insertButton = '<button id="insertBtn">추가</button>';
    var str = '';
    str += insertButton;
    if (resCode == 'empty') {
        str += "<p>데이터가 없습니다.</p>" +
               "<p>data를 추가해주세요!</p>";
        $("#dialog-list").html(str);
    } else if (resCode == 'success') {
        str += '<table>' +
                '<tr>' +
                '<th>일정이름</th>' +
                '<th>시작일자</th>' +
                '<th>종료일자</th>' +
                '</tr>';
        var myArray = new Array();
        myArray = JSON.parse(replyData);
        _detailData = myArray;
        for (var i = 0; i < myArray.length; i++) {
            str += '<tr data-id='+JSON.stringify(myArray[i].id)+' data-date='+myArray[i].dateStart+'>';
            str += '<td>' + myArray[i].subject + '</td>'
            str += '<td>' + myArray[i].dateStart + '</td>'
            str += '<td>' + myArray[i].dateEnd + '</td>'
            str += '</tr>'
        }
        str += '</table>';
        $("#dialog-list").html(str);
    } else {};
    insertafterbind();
}

//insert이후 bind.
function insertafterbind() {
    $("#insertBtn").unbind("click").bind("click", function () {
        fndatefickerinit();
        $('#insertDateStart').val(_startDate);
        $('#insertDateEnd').val(_startDate);
        $('#insertDateStartTime').val('16:00');
        $('#insertDateEndTime').val('17:00');
        
        _dialog.dialog("open");
    })

    $('#dialog-list tr').unbind("click").bind("click", function () {
        var id = $(this).attr('data-id');
        var date = $(this).attr('data-date');

        fnGetValueUsingId(date, id);
    });


}


//상세내용 html
function setDetailDialog(detailData) {
    var html = "";
    html += "<div class='w3-row'>";
    html += "<div class='w3-col 5'>"
    html += "<label>일정 제목</label>"
    html += "<input class='w3-input' type='text' id='detailSubject' value=" + detailData.subject + ">";
    html += "</div>"

    html += "<div class='w3-col 5'>"
    html += "<label>카테고리</label>"
    html += '<select class="w3-select" name="category" id="detailCategory" value="'+detailData.category+'">';
    html +=     '<option value="출장">출장</option>';
    html +=     '<option value="회의">회의</option>';
    html +=     '<option value="계약">계약</option>';
    html +=     '<option value="교육">교육</option>';
    html +=     '<option value="기타">기타</option>';
    html += '</select>';
    html += "</div>"

    html += "</div>"
    html += "<div class='w3-row'>";
    html += "<div class='w3-col m5'>";
    html += "<br><label>시작 일자</label>"
    html += "<input class='w3-input datePickSelect' type='text' id='detailDateStart'>";
    html += "</div>";
    html += "<div class='w3-col m5 w3-right'>";
    html += "<br><label>종료 일자</label>"
    html += "<input class='w3-input datePickSelect' type='text' id='detailDateEnd'>";
    html += "</div>"
    html += "</div>"

    html += "<div class='w3-row'>";
    html += "<div class='w3-col m5'>";
    html += "<br><label>시작 시간</label>"
    html += "<input class='w3-input' type='text' id='detailDateStartTime' value=" + detailData.dateStartTime + ">";
    html += "</div>";
    html += "<div class='w3-col m5 w3-right'>";
    html += "<br><label>종료 시간</label>"
    html += "<input class='w3-input' type='text' id='detailDateEndTime' value=" + detailData.dateEndTime + ">";
    html += "</div>"
    html += "</div>"

    html += "<br><label>상세 내용</label>"
    html += "<p><textarea class='w3-input' id='detailDescription'>" + detailData.description + "</textarea></p>";

    _startDate = detailData.dateStart;
    _id = detailData.id;

    $('#dialog-detail').html(html);
    fndatefickerinit();
    $('#detailDateStart').val(detailData.dateStart);
    $('#detailDateEnd').val(detailData.dateEnd);
    $('#detailCategory').val(detailData.category);
    
    _dialogDetail.dialog("open");
}


//TODO :: 삭제하면 테이블 남아있는부분 수정.