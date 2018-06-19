var _d = new Date();
var _year = (_d.getFullYear()).toString();
var _month = (_d.getMonth() + 1);
var _day = (_d.getDate()).toString();

var _monthdays = new Array(31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31);
var _weekdays = new Array('일', '월', '화', '수', '목', '금', '토');
var _dayOfWeekIndex = new Date(_year,_month-1,1).getDay();

var _dialog;
var _form;

$(document).ready(function () {
    _dialog = $( "#dialog-form" ).dialog({
        autoOpen: false,
        height: 400,
        width: 350,
        modal: true,
        buttons: {
            OK: function() {
                //TODO :: form 정합성 검사해야함.
                fnAjaxPost();
                init();
                _dialog.dialog("close");
            },
            Cancel: function() {
            _dialog.dialog("close");
            //TODO :: form 초기화 시켜줘야함.
            }
        }
    });
    // page UI init
    init();
});

function init() {
    calendarinit();
    bind();
}

function calendarinit() {
    $("#year").text(_year);
    $("#month").text(_month);
    //요일 표시
    $("#weekdays").html(function () {
        var str='';
        for (var i = 0; i < _weekdays.length; i++) {
            str += '<li>' + _weekdays[i] + '</li>'
        }
        return str;
    });

    //윤년계산
    if(_year%4 == 0 && _year % 100 !==0 || _year % 400 == 0){
        _monthdays[1] = 29;
    }
    fnDaysPrint(_month);

    $("#dateStartTime").val("17:00");
    $("#dateEndTime").val("18:00");
}

function bind() {
    $(".prev").unbind("click").bind("click", function () {
        _month--;
        if ( _month < 1) {
            _year --;
            _month = 12;
        }
        $("#month").text(_month);
        init();
    });

    $(".next").unbind("click").bind("click", function () {
        _month ++;
        if (_month > 12) {
            _year ++;
            _month = 1;
        }
        $("#month").text(_month);
        init();
    });

    //날짜 클릭시 event.
    $("#days li").unbind("click").bind("click",function() {
        // console.log($("li").index(this));
        // var dayOfWeekIndex = new Date(_year,_month-1,1).getDay();
        var monthValue = fnLeadingZeros(_month,2).toString();
        var daysValue = fnLeadingZeros(($(this).index()-(_dayOfWeekIndex-1)),2).toString();
        var dateValue = _year + monthValue + daysValue;

        $('#dateStart').val(dateValue);
        $('#dateEnd').val(dateValue);

        _dialog.dialog("open");
    })

    $( ".draggable" ).draggable({ 
        snap: "li" ,
        helper: "clone",
        revert: "valid"
    });

    $( ".droppable" ).droppable({ 
        drop: function( event, ui ) {
            var monthValue = fnLeadingZeros(_month,2).toString();
            var daysValue = fnLeadingZeros(($(this).index()-(_dayOfWeekIndex-1)),2).toString();
            var dateValue = _year + monthValue + daysValue;
            $('#dateStart').val(dateValue);
            $('#dateEnd').val(dateValue);
            $('#subject').val(ui.draggable[0].textContent);
            $('#decription').val(ui.draggable[0].textContent);

            fnAjaxPost();
            init();
        }
    });
    // $("#days li button").unbind("click",bind("click",function(){
    //     event.stopPropagation();
    // }));

    _form = _dialog.find( "form" ).on( "submit", function( event ) {
        event.preventDefault();
        fnAjaxPost();
    });
}

//dayOfWeek 0 = 일요일 6 = 토요일
function fnDaysPrint(input_month) {
    fnGetAppointment();
    $("#days").html(function () {
        var str = fnGetFirstDay();
        for(var i = 1 ; i < _monthdays[input_month-1]+1 ; i++) {
            //active 
            if(i == _day && (input_month == (_month+1)) && (_year == _d.getFullYear())) {
                str += '<li class="droppable"><span class="active">' + i + '</span></li>';
            } else {
                str += '<li class="droppable"><p>' + i +'</p></li>'
            }
        }
        return str;
    });
}

//1일이 무슨 요일인지 설정.
function fnGetFirstDay() {
    var result = '';
    for(var i = 0 ; i < _dayOfWeekIndex ; i++) {
        result += '<li><p>&nbsp</p></li>'
    }   
    return result;
}

function fnAjaxPost(){
    var data = $("#dialog-form form").serializeArray();
    $.ajax({
       url: "/api/calendar",
       data: data,
       type: "post",
       success: function(result){ 
           console.log(result);
           console.log('success!');
       },
       error: function(err){ 
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

function fnGetAppointment(){
    var monthValue = fnLeadingZeros(_month,2).toString();
    var data = {
        "month": monthValue,
        "year": _year
    }
    $.ajax({
        url: "/api/calendar/appointment",
        type: "post",
        data: data,
        success: function(result){
            if(result.resCode == 'false'){
                return;
            }
            console.log(result);
            for(var j = 0 ; j < result.appointment.length ; j++) {
                for(var i = 0 ; i < result.appointment[j].length ; i ++) {
                    var appointDate = result.appointment[j][i].dateStart;
                    var appointSubject = result.appointment[j][i].subject;
                    console.log(appointDate);
                    fnInsertBtn(appointDate,appointSubject);
                }
            }
        },
        error: function(err) {
            console.log(err);
        }
    });
}

//Calendar에 받은 date를 기반으로 li를 찾아 button을 삽입한다.
function fnInsertBtn(appointDate,appointSubject) { 
    var date = appointDate.substr(6,2);
    var dayOfWeekIndex = parseInt(_dayOfWeekIndex);
    var liIndex = dayOfWeekIndex + parseInt(date);

    var html = '';
    html += '<button>' + appointSubject + '</button>';
    $("#days li:nth-child(" + liIndex + ")").append(html);
}   
