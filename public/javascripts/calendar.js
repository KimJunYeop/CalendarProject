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
                console.log('update');
                fnUpdateAppointment();
                init();
                $(this).dialog('close');
                $('#dialog-list').dialog('close');
            }
        }
    });

    //dialog Input form
    _dialog = $("#dialog-form").dialog({
        autoOpen: false,
        height: 400,
        width: 350,
        buttons: {
            OK: function () {
                var dateValue = $('#dateStart').val();
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

    //일정 List 
    _dialogList = $("#dialog-list").dialog({
        autoOpen: false,
        height: 400,
        width: 500
    });
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

        $('#dateStart').val(dateValue);
        $('#dateEnd').val(dateValue);

        fnDialogInit(dateValue);
        _dialogList.dialog("open");
    })

    $(".draggable").draggable({
        snap: "li",
        helper: "clone",
        revert: "valid"
    });

    $(".droppable").droppable({
        drop: function (event, ui) {
            var monthValue = fnLeadingZeros(_month, 2).toString();
            var dayOfWeekIndex = new Date(_year, _month - 1, 1).getDay();
            var daysValue = fnLeadingZeros(($(this).index() - (dayOfWeekIndex - 1)), 2).toString();
            var dateValue = _year + monthValue + daysValue;
            $('#dateStart').val(dateValue);
            $('#dateEnd').val(dateValue);
            $('#subject').val(ui.draggable[0].textContent);
            $('#decription').val(ui.draggable[0].textContent);
            fnAjaxPost();
        }
    });

    $('#days button').unbind('click').bind('click',function(){
        alert('button clicked!');
    })

    _dialogForm = _dialog.find("form").on("submit", function (event) {
        event.preventDefault();
        fnAjaxPost();
    });
}

//dayOfWeek 0 = 일요일 6 = 토요일
function fnDaysPrint(input_month) {
    fnGetAppointment();
    $("#days").html(function () {
        var str = fnGetFirstDay();
        for (var i = 1; i < _monthdays[input_month - 1] + 1; i++) {
            //active 
            if (i == _day && (input_month == (_month + 1)) && (_year == _d.getFullYear())) {
                str += '<li class="droppable"><span class="active">' + i + '</span></li>';
            } else {
                str += '<li class="droppable"><p>' + i + '</p></li>'
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

//ul days 일정 가져오기
function fnAjaxPost() {
    var data = $("#dialog-form form").serializeArray();
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
                    var appointDate = result.appointment[j][i].dateStart;
                    var appointSubject = result.appointment[j][i].subject;
                    var appointEndDate = result.appointment[j][i].dateEnd;
                    fnInsertBtn(appointDate, appointSubject, appointEndDate);
                }
            }
        },
        error: function (err) {
            console.log(err);
        }
    });
}

//Calendar에 받은 date를 기반으로 li를 찾아 button을 삽입한다.
function fnInsertBtn(appointDate, appointSubject, appointEndDate) {
    var date = appointDate.substr(6, 2);
    //enddate 뒤에 두자리 날짜
    var enddate = appointEndDate.substr(6,2);
    var dayOfWeekIndex = new Date(_year, _month - 1, 1).getDay();
    dayOfWeekIndex = parseInt(dayOfWeekIndex);
    //startDate의 liIndex
    var liIndex = dayOfWeekIndex + parseInt(date);
    // console.log('liIndex : ' + liIndex);
    var liWidth = $('#days li').outerWidth();
    //endDatedml li Index
    var endDayIndex = dayOfWeekIndex + parseInt(enddate);
    // console.log('endDayIndex : ' + endDayIndex);
    var btnWidth = liWidth * (appointEndDate - appointDate + 1);
    var html = '';
    var _saturdayIndex;
    var btnWidthNext;
    var htmlNext = '';
    var overSaturday = fnGetSaturday(appointDate, appointEndDate, liIndex, function(saturdayIndex){
        // console.log('callback saturday index : ' + saturdayIndex);
        _saturdayIndex = saturdayIndex;
    });
    

    if (appointSubject == '회의') {
        html += '<button class="w3-pink" style="width: '
    } else if (appointSubject == '출장') {
        html += '<button class="w3-indigo" style="width: '
    } else if (appointSubject == '연차') {
        html += '<button class="w3-blue-grey" style="width: '
    } else if (appointSubject == '계약') {
        html += '<button class="w3-deep-orange" style="width: '
    } else if (appointSubject == '교육') {
        html += '<button class="w3-purple" style="width: '
    } else {
        html += '<button class="w3-green" style="width: '
    }

    if(overSaturday == 'over') {
        //토요일 index 에서 시작 index를 뺸 값으로 width 측정.
        btnWidth = liWidth * (_saturdayIndex - liIndex + 1);
        btnWidthNext = liWidth * ((endDayIndex - (_saturdayIndex+1))+1)
        htmlNext += html;
        htmlNext += btnWidthNext + 'px;">' + appointSubject + '</button>';
        $("#days li:nth-child(" + (_saturdayIndex+1) + ")").append(htmlNext);
    }

    html += btnWidth + 'px;">' + appointSubject + '</button>';
    $("#days li:nth-child(" + liIndex + ")").append(html);
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
        console.log('주를 넘겨!');
        result = 'over'
    } else {
        result = 'notOver'
    }

    return result;
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

//data가있다면 출력 없다면 없음메세지 출력
function fnTableInit(resCode, replyData) {
    var insertButton = '<button>추가</button>';
    if (resCode == 'empty') {
        var str = insertButton +
            "<p>데이터가 없습니다.</p>" +
            "<p>data를 추가해주세요!</p>";
        $("#dialog-list").html(str);
    } else if (resCode == 'success') {
        var str = insertButton + '<table>' +
            '<tr>' +
            '<th>일정이름</th>' +
            '<th>시작일자</th>' +
            '<th>종료일자</th>' +
            '</tr>';
        var myArray = new Array();
        myArray = JSON.parse(replyData);
        _detailData = myArray;
        for (var i = 0; i < myArray.length; i++) {
            str += '<tr>'
            str += '<td>' + myArray[i].subject + '</td>'
            str += '<td>' + myArray[i].dateStart + '</td>'
            str += '<td>' + myArray[i].dateEnd + '</td>'
            str += "<td style='display:none'>" + JSON.stringify(myArray[i].id) + "</td>"
            str += '</tr>'
        }
        str += '</table>';
        $("#dialog-list").html(str);
    } else {};
    insertafterbind();
}

//insert이후 bind.
function insertafterbind() {
    $("#dialog-list button").unbind("click").bind("click", function () {
        _dialog.dialog("open");
    })

    $('#dialog-list td').unbind("click").bind("click", function () {
        var id = $(this).siblings()[2].innerHTML;
        var date = $(this).parent()["0"].childNodes[1].innerHTML;

        fnGetValueUsingId(date, id);
    });
}


//상세내용 html
function setDetailDialog(detailData) {
    var html = "";
    html += "<br><label>일정 제목</label>"
    html += "<input class='w3-input' type='text' id='detailSubject' value=" + detailData.subject + ">";

    html += "<div class='w3-row'>";
    html += "<div class='w3-col m5'>";
    html += "<br><label>시작 일자</label>"
    html += "<input class='w3-input datePickSelect' type='text' id='detailDateStart' attr=" + detailData.id + " value=" + detailData.dateStart + ">";
    html += "</div>";
    html += "<div class='w3-col m5 w3-right'>";
    html += "<br><label>종료 일자</label>"
    html += "<input class='w3-input datePickSelect' type='text' id='detailDateEnd' value=" + detailData.dateEnd + ">";
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
    _dialogDetail.dialog("open");
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

//id를 이용해서 일정을 수정한다.
function fnUpdateAppointment() {
    var data = {
        subject: $('#detailSubject').attr('value'),
        dateStart: $('#detailDateStart').attr('value'),
        dateEnd: $('#detailDateEnd').attr('value'),
        dateStartTime: $('#detailDateStartTime').attr('value'),
        dateEndTime: $('#detailDateEndTime').attr('value')
    };
    console.log(data);

    $.ajax({
        url: '/api/calendar/update',
        type: "post",
        data: data,
        error: function (err) {
            console.log(err);
        }
    });
}