// JavaScript Document
$(function(){
	var _top=$(".top").height();
	var _top_line=_top+3;
	var _width=$(window).width();
    $(".left").css("height",$(window).height()-_top);
    $(".center").css("height",$(window).height()-70);
    $(".right").css("height",$(window).height()-_top_line);
    $(".msg-box").css("height",$(window).height()-70);
	$(".msg-box .cont").css("height",$(window).height()-82-$(".chat").outerHeight()-$(".msg-box .title").outerHeight());
	if(_width<=1600){$(".toolbar").css('height','68px');$(".center-main").css("height",$(window).height()-138);}
	else{$(".toolbar").css('height','34px');$(".center-main").css("height",$(window).height()-104);}
	
	
    $(".center-main-b").css("height",$(window).height()-70);
    //视频----start
    var videoHeight = $('#center').height();
    var videoWidth = $('#center').width();
    $('#divVideoRemote video').css("height",videoHeight);
    $('#divVideoRemote video').css("width",videoWidth);
    $('#divVideoRemote video').css('margin','0 auto');
    //视频----end

    //白板----start
    var whiteboardHeight = $('#center').height() - 34;
    var whiteboardWidth = $('#center').width();
    $("#v-box-canvas").css({width:whiteboardWidth, height:whiteboardHeight});
    $("#back-canvas").css({width:whiteboardWidth, height:whiteboardHeight});
    $("#top-canvus").css({width:whiteboardWidth, height:whiteboardHeight});
    $("#drawing-canvus").css({width:whiteboardWidth, height:whiteboardHeight});
    $("#show-drawing-canvus").css({width:whiteboardWidth, height:whiteboardHeight});

    var canvas = document.getElementById("drawing-canvus");
    var context = canvas.getContext("2d");
    var canvas_show = document.getElementById("show-drawing-canvus");
    var context_show = canvas_show.getContext("2d");
    var canvas_top = document.getElementById("top-canvus");
    var canvas_top_context = canvas_top.getContext("2d");
    var canvas_back = document.getElementById("back-canvas");
    var canvas_back_context = canvas_back.getContext("2d");

    var xy=$(canvas).width() + "," + $(canvas).height();
    setTimeout(function(){
        $("#drawing-canvus").trigger("screenchage", xy);
    },1000);
    //白板----end

    $(window).resize(function(){
    	_width=$(window).width();
        $(".left").css("height",$(window).height()-_top);
        $(".center").css("height",$(window).height()-70);
        $(".msg-box").css("height",$(window).height()-70);
        $(".right").css("height",$(window).height()-_top_line);
        $(".msg-box .cont").css("height",$(window).height()-82-$(".chat").outerHeight()-$(".msg-box .title").outerHeight());
		if(_width<=1600){$(".toolbar").css('height','68px');$(".center-main").css("height",$(window).height()-138);}
		else{$(".toolbar").css('height','34px');$(".center-main").css("height",$(window).height()-104);}

        var hh = $('body').height()-30-20*2-34;
//        var hh = $(".main").height() - 34;
        var ww = $(".main").width() - 656;

        //视频-----start
        var videoHeight = $('#center').height();
        var videoWidth = $('#center').width();
        $('#divVideoRemote video').css("height",videoHeight);
        $('#divVideoRemote video').css("width",videoWidth);
        $('#divVideoRemote video').css('margin','0 auto');
        //视频-----end

        //白板-----start
        var whiteboardHeight = $('#center').height() - 34;
        var whiteboardWidth = $('#center').width();
        $("#v-box-canvas").css({width:whiteboardWidth, height:whiteboardHeight});
        $("#back-canvas").css({width:whiteboardWidth, height:whiteboardHeight});
        $("#top-canvus").css({width:whiteboardWidth, height:whiteboardHeight});
        $("#drawing-canvus").css({width:whiteboardWidth, height:whiteboardHeight});
        $("#show-drawing-canvus").css({width:whiteboardWidth, height:whiteboardHeight});

        var xy=$(canvas).width() + "," + $(canvas).height();
        $("#drawing-canvus").trigger("screenchage", xy);
        //白板-----end
    });

    //老师 收缩箭头
    $(".name em").click(function(){
        if($(this).hasClass("on")){
            $(this).removeClass("on");
            $(".tea-h-s").slideDown("fast");
            $(".name .sa").text(VC.ROUTER.LIVEBIG.FOLD);
        }
        else{
            $(this).addClass("on");
            $(".tea-h-s").slideUp("fast");
            $(".name .sa").text(VC.ROUTER.LIVEBIG.DISPLAY);
        }
    });

    //学生列表 收缩箭头

    $(".serbar-r em").click(function(){
        if($(this).hasClass("on")){
            $(this).removeClass("on");
            $(".student-list").slideDown("fast");
        }
        else{
            $(this).addClass("on");
            $(".student-list").slideUp("fast");
        }
    });

    //左边栏 切换
    $(".menu li").click(function(){
        $(this).addClass("on").siblings().removeClass("on");
        $(".left-cont").find(".left-sub").eq($(this).index()).show().siblings().hide();
    });

    //左边栏 老师列表

    $(".tea-list dd, .student-list dd").click(function(){
        $(this).addClass("on").siblings().removeClass("on");
    });


    //中间提示文字 显示后隐藏

    $(".pop-word").show(1000).delay(3000).fadeOut(300);

    //左边栏 收缩
    $(".handle-a").toggle(function(){
        $(this).addClass("handle-on")	;
        $(".left-cont").hide();
        $(".left").css('width','0');
        $(".center").css("margin-left",'34px');

        $('#color_coordinate').val(60);

        //视频-----start
        var videoHeight = $('#center').height();
        var videoWidth = $('#center').width();
        $('#divVideoRemote video').css("height",videoHeight);
        $('#divVideoRemote video').css("width",videoWidth);
        $('#divVideoRemote video').css('margin','0 auto');
        //视频-----end
        //白板-----start
        var whiteboardHeight = $('#center').height() - 34;
        var whiteboardWidth = $('#center').width();
        $("#v-box-canvas").css({width:whiteboardWidth, height:whiteboardHeight});
        $("#back-canvas").css({width:whiteboardWidth, height:whiteboardHeight});
        $("#top-canvus").css({width:whiteboardWidth, height:whiteboardHeight});
        $("#drawing-canvus").css({width:whiteboardWidth, height:whiteboardHeight});
        $("#show-drawing-canvus").css({width:whiteboardWidth, height:whiteboardHeight});

        var xy=$(canvas).width() + "," + $(canvas).height();
        $("#drawing-canvus").trigger("screenchage", xy);
        //白板-----end
    },function(){
        $(this).removeClass("handle-on");
        $(".left-cont").show();
        $(".left").css('width','320px');
        $(".center").css("margin-left",'354px');

        $('#color_coordinate').val(380);

        //视频-----start
        var videoHeight = $('#center').height();
        var videoWidth = $('#center').width();
        $('#divVideoRemote video').css("height",videoHeight);
        $('#divVideoRemote video').css("width",videoWidth);
        $('#divVideoRemote video').css('margin','0 auto');
        //视频-----end
        //白板-----start
        var whiteboardHeight = $('#center').height() - 34;
        var whiteboardWidth = $('#center').width();
        $("#v-box-canvas").css({width:whiteboardWidth, height:whiteboardHeight});
        $("#back-canvas").css({width:whiteboardWidth, height:whiteboardHeight});
        $("#top-canvus").css({width:whiteboardWidth, height:whiteboardHeight});
        $("#drawing-canvus").css({width:whiteboardWidth, height:whiteboardHeight});
        $("#show-drawing-canvus").css({width:whiteboardWidth, height:whiteboardHeight});

        var xy=$(canvas).width() + "," + $(canvas).height();
        $("#drawing-canvus").trigger("screenchage", xy);
        //白板-----end
    });

    //右边栏 收缩
    /*$(".handle-b").toggle(function(){
     $(this).addClass("handle-on")	;
     $(".right-cont").hide();
     $(".right").css('width','14px');
     $(".right-main").css('width','0');
     $(".center").css("margin-right",'34px');
     $(".tip-pop").show(300).delay(1000).fadeOut(400);
     },function(){
     $(this).removeClass("handle-on");
     $(".right-cont").show();
     $(".right").css('width','314px');
     $(".right-main").css('width','300px');
     $(".center").css("margin-right",'334px');
     });*/

    //课堂加密 增加人数 弹窗
    $(".lock-add a").click(function(){
        var _n=$(this).index();
        if($(this).hasClass("on")){
            $(this).removeClass("on");
            $(".pop-num").hide().find("p").hide();
            $(".arrow-wrap i").hide();
        }
        else{
            $(this).addClass("on").siblings().removeClass("on");
            $(".pop-num").show().find("p").eq(_n).show().siblings().hide();
            $(".arrow-wrap i").eq(_n).show().siblings().hide();

        }
    });

    //到课学生 讨论区 收缩展开

    $(".title h5").toggle(function(){
        $(this).addClass("on").parent().parent().find(".slide-a").slideUp("fast");
    },function(){
        $(this).removeClass("on").parent().parent().find(".slide-a").slideDown("fast");
    });


    //工具栏 弹窗
    /*$(".toolbar-cont dd a").click(function(){
     if($(this).hasClass("on")){
     $(".toolbar-cont dd a").removeClass("on");
     $(".toolbar-cont .pop").hide();
     }
     else{
     $(".toolbar-cont dd a").removeClass("on");
     $(this).addClass("on");
     $(".toolbar-cont .pop").hide();
     $(this).next(".pop").show();
     }
     });*/

});