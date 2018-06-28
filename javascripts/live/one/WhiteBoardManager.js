var WhiteBoardManagerModule = WhiteBoardManagerModule || {};

var canvas,context,canvas_show,context_show;
var canvas_top,canvas_top_context,canvas_back,canvas_back_context;
var canvas_color,canvas_color_context,current_color_context;
//var screenImage;
//var canvas_Max_Width,canvas_Max_Height;
/*
canvas = document.getElementById("drawing-canvus");
context = canvas.getContext("2d");

canvas_show = document.getElementById("show-drawing-canvus");
context_show = canvas_show.getContext("2d");

canvas_top = document.getElementById("top-canvus");
canvas_top_context = canvas_top.getContext("2d");

canvas_back = document.getElementById("back-canvas");
canvas_back_context = canvas_back.getContext("2d");
		
canvas_color = document.getElementById("drawing-color");
canvas_color_context = canvas_color.getContext("2d");
current_color_context = document.getElementById("drawing-current-color").getContext("2d");*/


var currentPage=1;
var oldPage=1;	// the last drawing page, not the previous page!!!
var totalPage = 1;
var imageArray = new Array();	// the course suit images src array.

var startDraw = false;	// the flag which indicate current status is drawing or not
var startX,startY;	// the start position of current drwaing 
var eraserXY=3;	// brush constant to display the size of the brusher
var eraserSize=6;	// brush constant to display the size of the brusher
var arrow1=15;		// together with arrow2 to adjust the angle of the arrow drawing.
var arrow2=35;		// together with arrow1 to adjust the angle of the arrow drawing.
var arrowAngle=25;	// the scaler to generate the arrow angle, use to muplify to	
var toolType = 0;	// the type of the drawing tools, such as 'Line', 'Circle', etc.

//var oldStartX, oldStartY, oldX, oldY;	// useless can be deleted.
var isClass=0;		// indicate current status is discussion or teaching.	讨论或授课

var pixels = new Array();	// just for the 'Point' tools. 
				// the array to keep the point tools split the positions with the same length to avoid the position data to large 
var members = new Array();	// the chat members aside the right

var role;   //用户角色
var userid; //用户ID
var roomId;   //房间ID
var realName;//用户名称
var classroomName = "";//课室名称

function WhiteBoardManager(classRoomController){
	this.classRoomController = classRoomController;
    WhiteBoardManagerModule.instance = this;
}

WhiteBoardManager.prototype = {
	init:function(){
		
		canvas = document.getElementById("drawing-canvus");
		context = canvas.getContext("2d");

		canvas_show = document.getElementById("show-drawing-canvus");
		context_show = canvas_show.getContext("2d");

		canvas_top = document.getElementById("top-canvus");
		canvas_top_context = canvas_top.getContext("2d");

		canvas_back = document.getElementById("back-canvas");
		canvas_back_context = canvas_back.getContext("2d");
				
		canvas_color = document.getElementById("drawing-color");
		canvas_color_context = canvas_color.getContext("2d");
		current_color_context = document.getElementById("drawing-current-color").getContext("2d");

        role = $('#role').val();    //用户角色
        userid = $('#userid').val();    //用户ID
        roomId = $('#classRoomId').val();   //房间ID
        realName = $('#realname').val();//用户名称

		// TODO::初始化

		//this._initControl();          //根据role判断是否显示白板按钮
		this._initColor();              //初始化颜色面板
		this._initPage();               //初始化白板页数
		this._bindEvent();              //绑定事件
	},
	onReceive:function(classRoom){
		// TODO::接受服务器端的回调
		$("#drawing-canvus").trigger("drawoperate", classRoom);
	},
	_render:function(){
		// TODO::渲染视图
	},
	_bindEvent:function(){
		// TODO::绑定事件
		this._bindColorEvent();         //绑定颜色
		this._bindToolsEvent();         //绑定工具
		this._bindCanvasEvent("#drawing-canvus");
		this._bindPageEvent("#first","#prev","#next","#last");
		this._bindControlEvent();
	},
	_sendPixelMessage:function(cmd, typeid, bginfo, data, isshow, memberid){
//		if(!this.classRoomController._initWebSocket()) return;
		if(cmd == "done" && (data == "" || data == null || data.length <= 1)) return;
		// send the datas drawn while the mouse left buttons up to down.
		var jsonData = this._getJsonMessage(cmd, typeid, bginfo, data, isshow, memberid);
		this.classRoomController.sendMessage(jsonData);
	},
	_getJsonMessage:function(command, typeid, imageinfo, coordinates, isshow, memberid) {
		//command操作类别名    typeid   imageinfo当前图片     coordinates座标
		var jsonMessage = {roomid:this.classRoomController.classRoomID,
							cmd:"whiteboard:" + command,
							userid:this.classRoomController.userID,
							memberid:memberid,
							typeid:parseInt(typeid),
							pageno:parseInt(currentPage),
							oldpage:oldPage,
							bginfo:imageinfo,
							color:this._getCurrentColor(),
							size:parseInt(this._getLineWidth()),
							coordinate:coordinates,
							widthheight:canvas.width+","+canvas.height,
							show:isshow,
                            userName:realName,
                            classroomName:classroomName
						   };
	    return jsonMessage;
	},
	// typeid:
	// 0 - restore the screne, 
	// 1 - pagination
	_sendPageMessage:function(cmd, typeid){
//		if(!this.classRoomController._initWebSocket()) return;
		if(cmd != "getpage") return;
		var jsonData = this._getPageJsonMessage(cmd, typeid);
		this.classRoomController.sendMessage(jsonData);
	},
	_getPageJsonMessage:function(command, typeid) {
		//command操作类别名    typeid   imageinfo当前图片     coordinates座标
		var jsonMessage = {roomid:this.classRoomController.classRoomID,
							cmd:"whiteboard:" + command,
							userid:this.classRoomController.userID,
							pageno:parseInt(currentPage),
							typeid:typeid,
                            userName:realName,
                            classroomName:classroomName
						   };
	    return jsonMessage;
	},
	
// ==================== start 辅助私有方法 ===================
	_getLineWidth:function(){
		//取粗细
		var lineValue = WhiteBoardManagerModule.instance.getLineValue();
		var coLineWidth = this._getValidAdjust(lineValue);
		context.lineWidth = coLineWidth;
		return coLineWidth;
	},
	_getCurrentColor:function(){
		//取当前颜色
		var imageData = current_color_context.getImageData(0, 0, 20, 20);
		var r = imageData.data[0]; //r g b颜色的算法
		var g = imageData.data[1];
		var b = imageData.data[2];
		return 'rgba(' + r + ',' + g + ',' + b + ',' + 1.0 * 255 + ')';
	},
	_preImage:function(url,callback){	// optimize the loading speed for the images.
        var that = WhiteBoardManagerModule.instance;
		//生成图片回传
		var imgs = new Image(); //创建一个Image对象，实现图片的预下载
		imgs.src = url;
		
		if (imgs.complete) { // 如果图片已经存在于浏览器缓存，直接调用回调函数
			callback.call(that, imgs);
			return; // 直接返回，不用再处理onload事件  
	    }  
	 
		imgs.onload = function () { //图片下载完毕时异步调用callback函数。
			callback.call(that, imgs);//将回调函数的this替换为Image对象
		};  
	},
	_getValidAdjust:function(value) {
		//粗细调用该方法
		value = parseInt(value);
		var thickness = isNaN(value) ? 3 : value;
		return Math.max(3, Math.min(thickness, 30));
	},
	_getMousePos:function(evt) {
		//鼠标位置
		var rect = canvas.getBoundingClientRect(); 
		return { 
			x: evt.clientX - rect.left * (canvas.width / rect.width),
			y: evt.clientY - rect.top * (canvas.height / rect.height)
		}
	},
	_clearCanvas:function() {
		//清理
		context.clearRect(0,0,canvas.width,canvas.height);
	},
	_clearCanvasShow:function() {
		//清理
		context_show.clearRect(0,0,canvas_show.width,canvas_show.height);
	},
	
	
	_loadBackCanvasImgae:function(imageSrc){
		
		canvas_back.width = parseInt($('#v-box-canvas').width());
		canvas_back.height = parseInt($('#v-box-canvas').height());
		canvas_back_context.clearRect(0,0,canvas_back.width,canvas_back.height);

		canvas_back_context.fillStyle = "#ffffff";
		canvas_back_context.fillRect(0,0,canvas_back.width,canvas_back.height)
		//TODO::课件图片
		this._preImage(imageSrc,function(imgs){
			canvas_back_context.drawImage(imgs,0,0,canvas_back.width,canvas_back.height);
	    });
	},
	_getImageSrc:function(page){
		//TODO::取图片地址 现在是写死的路径地址 以后要修改
		//http://192.168.106.32/upload/1/2/page1.png
		if(imageArray == undefined || imageArray.length <= 0){ console.log("图片数组为空"); return "";}
//		return "http://14.29.127.25:9000/upload/" + imageArray[page].replace(/\\/g, "/");
		//return "http://192.168.106.32/upload/" + imageArray[page].replace(/\\/g, "/");
		return imageArray[page].replace(/\\/g, "/");
		//return "http://"+window.location.host+"/upload/" + imageArray[page].replace(/\\/g, "/");
	},
// ==================== end 辅助私有方法 ===================
	
	whiteboardOn:function(){
		//TODO::开启白板
	},
	whiteboardOff:function(){
		//TODO::关闭白板
	},
	whiteboardToolsOn:function(){
		//TODO::工具条开启
	},
	whiteboardToolsOff:function(){
		//TODO::工具条关闭
	},
    getSharePCVideoStatus:function(){
        //TODO::获取是否共享屏幕的状态
    },
    setShareWhiteboard:function(status){
        //TODO::设置共享白板状态
    },
// ==================== start 初始化选择颜色canvas ===================
	_showWhiteboard:function(isshow){
		if(isshow){
			$("#v-box-cont").css("background-color","#ffffff");
            if(parseInt(this.classRoomController.role)==2 && WhiteBoardManagerModule.instance.getSharePCVideoStatus()){

            }else{
                WhiteBoardManagerModule.instance.whiteboardOn();//开启白板,隐藏视频
            }
            if(role == 1) {
                WhiteBoardManagerModule.instance.whiteboardToolsOn();
            }else{
                if(WhiteBoardManagerModule.instance.getWhiteBoardIsShareStatus()){
                    WhiteBoardManagerModule.instance.whiteboardToolsOn();
                }else{
                    WhiteBoardManagerModule.instance.whiteboardToolsOff();
                }
            }
			/*for(var i=0; i<members.length; i++){
				if(userid == members[i].userid){
					if(parseInt(members[i].roleid) == 1){
						WhiteBoardManagerModule.instance.whiteboardToolsOn();
						continue;
					}

					if(members[i].stopwhiteboard == 1)
						WhiteBoardManagerModule.instance.whiteboardToolsOn();
					else
						WhiteBoardManagerModule.instance.whiteboardToolsOff();
				}
			}*/
		}
		else{
			$("#v-box-cont").css("background-color","#000000");
			WhiteBoardManagerModule.instance.whiteboardOff();//关闭白板,显示视频
			WhiteBoardManagerModule.instance.whiteboardToolsOff();
		}
        WhiteBoardManagerModule.instance.setTeaWhiteboardStatus(isshow);
	},
	_initControl:function(){
		if(parseInt(this.classRoomController.role)==1)
			$("#whiteboard").css("display","block");
		else
			$("#whiteboard").css("display","none");
	},
	_initColor:function(){
		context.strokeStyle = "#03c0ff";
	    context.fillStyle ="#03c0ff";
		current_color_context.fillStyle="#03c0ff";
		current_color_context.fillRect(0,0,20,20);
		this._preImage("../classroomassets/images/color_bar.jpg",function(imgs){
			canvas_color_context.drawImage(imgs,0,0,canvas_color.width,canvas_color.height);
	    });
	},
	initWhiteboardPage:function(currentPage,totalPage){		  //--->由liveController覆盖实现
		//TODO::初始化页数
		//$("#currPage").html("<strong>"+currentPage+"</strong>/"+totalPage+"页");
	},
	_initPage:function(){
		var parent = this;		
		$.ajax({
	        url: VC.ROUTER.LIVE.ROOMDETAIL,
	        type: "get",
	        async: false,
	        data: "roomid="+this.classRoomController.classRoomID+"&t="+new Date().getTime(),
	        dataType: "json",
	        success: function (data) {
	        	totalPage=data.imgs.length;
	        	WhiteBoardManagerModule.instance.initWhiteboardPage(currentPage, totalPage);
	        	//$("#currPage").html("<strong>"+currentPage+"</strong>/"+totalPage+"页");
	        	if(totalPage>0){
		        	for(var i=1; i<=totalPage; i++){
		        		if(data.imgs[i-1] == null || data.imgs[i-1] == undefined) continue;
		        		imageArray[i] = data.imgs[i-1].fileurl
		        	}
		        	if(data.imgs[0] != null && data.imgs[0] != undefined){		        		
		        		//var backImageSrc = "http://192.168.106.32/upload/" + data.imgs[0].fileurl.replace(/\\/g, "/");
		        		//var backImageSrc = "http://" + window.location.host + "/upload/" + data.imgs[0].fileurl.replace(/\\/g, "/");
		        		var backImageSrc = data.imgs[0].fileurl.replace(/\\/g, "/");
			        	parent._loadBackCanvasImgae(backImageSrc);
		        	}
	        	}
	        },
	        error: function () {
	            console.log("Request Error!");
	        }
	    });
	},
// ==================== end 初始化选择颜色canvas ===================
	
// ======================== start 事件版定 =======================
    _detectmob : function(){    //检测是否为手机
        if( navigator.userAgent.match(/Android/i)
            || navigator.userAgent.match(/webOS/i)
            || navigator.userAgent.match(/iPhone/i)
            || navigator.userAgent.match(/iPad/i)
            || navigator.userAgent.match(/iPod/i)
            || navigator.userAgent.match(/BlackBerry/i)
            || navigator.userAgent.match(/Windows Phone/i)
            ) {
            return true;
        }else{
            return false;
        }
    },
    _getLeft : function(e){ //获取某元素与网页的左边距
        var offset=e.offsetLeft;
        if(e.offsetParent!=null) offset+= this._getLeft(e.offsetParent);
        return offset;
    },
	_bindColorEvent:function(){
		//绑定颜色选择与当前颜色事件
		$(canvas_color).bind("mousedown", function(e) {
            if(WhiteBoardManagerModule.instance._detectmob())return;
//            var color_coordinate = parseInt($('#color_coordinate').val());
			var x = parseInt(e.clientX - WhiteBoardManagerModule.instance._getLeft(this));
			var y = parseInt(e.clientY - canvas_color.offsetTop);
//		    var imageData = canvas_color_context.getImageData(e.pageX - canvas_color.offsetLeft, e.pageY - canvas_color.offsetTop, canvas_color.width, canvas_color.height);
			var imageData = canvas_color_context.getImageData(x,10, canvas_color.width, canvas_color.height);
		    var r = imageData.data[0]; //r g b棰滆壊鐨勭畻娉�
		    var g = imageData.data[1];
		    var b = imageData.data[2];
		    context.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + 1.0 * 255 + ')';
		    context.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + 1.0 * 255 + ')';
		    current_color_context.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + 1.0 * 255 + ')';
		    current_color_context.fillRect(0,0,20,20);
		});

        /** 触屏 */
        $(canvas_color)[0].addEventListener('touchstart',function(event){
            var x = parseInt(event.touches[0].pageX - WhiteBoardManagerModule.instance._getLeft(this));
            var y = parseInt(event.touches[0].pageY - canvas_color.offsetTop);
            var imageData = canvas_color_context.getImageData(x,10, canvas_color.width, canvas_color.height);
            var r = imageData.data[0]; //r g b棰滆壊鐨勭畻娉�
            var g = imageData.data[1];
            var b = imageData.data[2];
            context.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + 1.0 * 255 + ')';
            context.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + 1.0 * 255 + ')';
            current_color_context.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + 1.0 * 255 + ')';
            current_color_context.fillRect(0,0,20,20);
        },false);
		
		$("#drawing-current-color").mousemove(function(){
			$("#drawing-current-color").css("cursor","pointer");
		});
		
		/*$("#drawing-current-color").click(function(){
			WhiteBoardManagerModule.instance.colorON_OFF();
		})*/
	},
	selectTool:function(toolName){
		//TODO::选择工具
	},
	fontON_OFF:function(){
		//TODO::文本开关
	},
	//绑定工具事件
	_bindToolsEvent:function(){
		var parent = this;
		//0画笔="c",1橡皮檫="d",2圆="e",3方形="f",4直线="g",5箭头="h",6文本="i",清屏="j"
		$("#pen").click(function(){
			WhiteBoardManagerModule.instance.selectTool('pen');
			toolType = 0;	//画笔
			context.strokeStyle = parent._getCurrentColor();
			context.fillStyle = parent._getCurrentColor();
			context.lineWidth = parent._getLineWidth();
		});	
		$("#eraser").click(function(){
			WhiteBoardManagerModule.instance.selectTool('eraser');
			toolType = 1;	//橡皮檫
			context.lineWidth = parent._getLineWidth();
		});	
		$("#circle").click(function(){
			WhiteBoardManagerModule.instance.selectTool('circle');
			toolType = 2;	//圆
			context.strokeStyle = parent._getCurrentColor();
			context.fillStyle = parent._getCurrentColor();
			context.lineWidth = parent._getLineWidth();
		});	
		$("#party").click(function(){
			WhiteBoardManagerModule.instance.selectTool('party');
			toolType = 3;	//方形
			context.strokeStyle = parent._getCurrentColor();
			context.fillStyle = parent._getCurrentColor();
			context.lineWidth = parent._getLineWidth();
		});	
		$("#straightline").click(function(){
			WhiteBoardManagerModule.instance.selectTool('straightline');
			toolType = 4;	//直线
			context.strokeStyle = parent._getCurrentColor();
			context.fillStyle = parent._getCurrentColor();
			context.lineWidth = parent._getLineWidth();
		});	
		$(".tools-b .h").click(function(){      //暂时没用
			toolType = 5;	//箭头
			context.strokeStyle = parent._getCurrentColor();
			context.fillStyle = parent._getCurrentColor();
			context.lineWidth = parent._getLineWidth();
		});	
		$("#font").click(function(){
			WhiteBoardManagerModule.instance.selectTool('font');
			WhiteBoardManagerModule.instance.fontON_OFF();
            if(WhiteBoardManagerModule.instance.fontIsOn())
                toolType = 6;	//文本
            else
                toolType = 0;
			context.strokeStyle = parent._getCurrentColor();
			context.fillStyle = parent._getCurrentColor();
			context.lineWidth = parent._getLineWidth();
		});	
		$("#clean").click(function(){       //清屏
            var msg = VC.ROUTER.LIVEBIG.LIVE_CLEAN_WHITEBOARD_TIPS;
            var modalInstance =  WhiteBoardManagerModule.instance.operationMessageWindow(msg);
            modalInstance.result.then(function(result){
                if(result){
                    WhiteBoardManagerModule.instance.cleanWhiteboard();
                }
            });
            /*WhiteBoardManagerModule.instance.selectTool('clean');
            parent._clearCanvas();
            parent._clearCanvasShow();
            parent._sendPixelMessage("done", 7, "", "7#0,0", true, 0);*/
		});
		

		$("#changeLine li").bind("click", function(){           //选择线条
			var classValue = $(this).attr("title");
			WhiteBoardManagerModule.instance.setLineValue(classValue);
			var widthVal = parent._getValidAdjust(classValue);
			context.lineWidth = widthVal;
			WhiteBoardManagerModule.instance.lineOff();
		});
	},
    cleanWhiteboard:function(){     //清屏
        WhiteBoardManagerModule.instance.selectTool('clean');
        WhiteBoardManagerModule.instance._clearCanvas();
        WhiteBoardManagerModule.instance._clearCanvasShow();
        WhiteBoardManagerModule.instance._sendPixelMessage("done", 7, "", "7#0,0", true, 0);
    },
    operationMessageWindow:function(msg){
        //TODO::白板操作提示窗口
    },
	setLineValue:function(value){
		//TODO::设置当前线条的大小
	},
	getLineValue:function(){
		//TODO::获取当前线条的大小
	},
	colorOff:function(){
		//TODO::隐藏调色板
	},
	lineOff:function(){
		//TODO::隐藏线条粗细
	},
	fontOff:function(){
		//TODO::隐藏文本
	},
    fontIsOn:function(){
        //TODO::是否开启文本输入
    },
	whiteboardToolsIsOn:function(){
		//TODO::判断工具条是否开启,返回一个布尔值
	},
	//绑定画板事件
	_bindCanvasEvent:function(drawingCanvas){
		var parent = this;

        /** 触屏,手指点击 */
        $(drawingCanvas)[0].addEventListener('touchstart',function(event){
            context.beginPath();
            WhiteBoardManagerModule.instance.colorOff();
            WhiteBoardManagerModule.instance.lineOff();
            var toolsIsOn =  WhiteBoardManagerModule.instance.whiteboardToolsIsOn();
            if(!toolsIsOn) return;
            //手指位置
            var rect = canvas.getBoundingClientRect();
            var x =  event.touches[0].clientX - rect.left * (canvas.width / rect.width);
            var y = event.touches[0].clientY - rect.top * (canvas.height / rect.height);
            var downStartX = x;
            var downStartY = y;
            startX = x;
            startY = y;
            context.lineWidth = parent._getLineWidth();
            context.strokeStyle = parent._getCurrentColor();
            context.fillStyle = parent._getCurrentColor();
            startDraw = true;
            coOordinates = "" + toolType;

            if(toolType == 1){	//橡皮擦
                var size = context.lineWidth;
                context.clearRect(downStartX - size * eraserXY ,  downStartY - size * eraserXY , size * eraserSize, size * eraserSize);
                context_show.clearRect(downStartX - size * eraserXY ,  downStartY - size * eraserXY , size * eraserSize, size * eraserSize);
                var eraserMessage = toolType + "#" + downStartX + "," + downStartY;
                $(drawingCanvas).trigger("draw", eraserMessage);
            }
            else if(toolType == 2 || toolType == 3 || toolType == 4 || toolType == 5) {
                beforeLineImage = canvas.toDataURL("image/png");
            }
            else if(toolType == 6){	//文本
                if(!WhiteBoardManagerModule.instance.fontIsOn()){
                    return;
                }
                textValue = $("#txtText").val();
                if(textValue=="" || textValue == null){
                    var msg = VC.ROUTER.LIVEBIG.WHITEBOARDMANAGER_INPUT_TEXT;
                    WhiteBoardManagerModule.instance.showMessageWindow(msg);
                    return;
                }
                context_show.font="normal " + ((parseInt(context.lineWidth) * 6)<10 ? 10 : (parseInt(context.lineWidth) * 6)) + "px arial";
                var textMessage = toolType + "#" + downStartX + "," + downStartY + "#" + textValue;
                $(drawingCanvas).trigger("draw", textMessage);
                context_show.fillText(textValue, downStartX, downStartY);
            }
        },false);
        /** 触屏,手指滑动屏幕 */
        $(drawingCanvas)[0].addEventListener('touchmove',function(event){
            // 如果这个元素的位置内只有一个手指的话
            if (event.targetTouches.length == 1) {
                event.preventDefault();// 阻止浏览器默认事件，重要

                var toolsIsOn =  WhiteBoardManagerModule.instance.whiteboardToolsIsOn();
                if(!toolsIsOn) return;
                context.lineWidth = parent._getLineWidth();
                context.strokeStyle = parent._getCurrentColor();
                context.fillStyle = parent._getCurrentColor();

                //手指位置
                var rect = canvas.getBoundingClientRect();
                var x =  event.touches[0].clientX - rect.left * (canvas.width / rect.width);
                var y = event.touches[0].clientY - rect.top * (canvas.height / rect.height);
                if (toolType == 0) {	//画笔
                    if(startDraw){
                        //第1方案 鼠标松开时菜发送坐标
                        var endX = x;
                        var endY = y;
                        context.lineTo(endX, endY);
                        coOordinates += "#" + endX + "," + endY;
                        context.stroke();
                    }
                }else if (toolType==1) { //橡皮擦
                    var endX = x;
                    var endY = y;
                    var size = context.lineWidth;
                    canvas_top_context.clearRect(0,0,canvas_top.width,canvas_top.height);
                    canvas_top_context.beginPath();
                    canvas_top_context.strokeStyle =  '#000000';
                    canvas_top_context.moveTo(endX - size * eraserXY, endY - size * eraserXY);
                    canvas_top_context.lineTo(endX + size * eraserXY, endY - size * eraserXY);
                    canvas_top_context.lineTo(endX + size * eraserXY, endY + size * eraserXY);
                    canvas_top_context.lineTo(endX - size * eraserXY, endY + size * eraserXY);
                    canvas_top_context.lineTo(endX - size * eraserXY, endY - size * eraserXY);
                    canvas_top_context.stroke();

                    if(startDraw){
                        context.clearRect(endX - size * eraserXY,  endY - size * eraserXY, size * eraserSize, size * eraserSize);
                        context_show.clearRect(endX - size * eraserXY,  endY - size * eraserXY, size * eraserSize, size * eraserSize);
                        coOordinates = toolType + "#" + endX + "," + endY;
                        $(drawingCanvas).trigger("draw", coOordinates);
                    }
                }else if (toolType==2) {	//圆
                    if(startDraw){
                        var endX = x;
                        var endY = y;
                        context.beginPath();
                        var k = ((endX-startX)/0.75)/2,
                            w = (endX-startX)/2,
                            h = (endY-startY)/2;
                        context.clearRect(0,0,canvas.width,canvas.height);
                        context.moveTo(startX, parseFloat(startY-h));
                        context.bezierCurveTo(parseFloat(startX+k), parseFloat(startY-h), parseFloat(startX+k), parseFloat(startY+h), startX, parseFloat(startY+h));
                        context.bezierCurveTo(parseFloat(startX-k), parseFloat(startY+h), parseFloat(startX-k), parseFloat(startY-h), startX, parseFloat(startY-h));
                        var lineXY = startX + "," + startY + "#" + endX + "," + endY;
                        coOordinates = toolType + "#" + lineXY;
                        context.closePath();
                        context.stroke();

                        parent._preImage(beforeLineImage,function(imgs){
                            context.drawImage(imgs,0,0,canvas.width,canvas.height);
                        });
                    }
                }else if (toolType == 3) {	//方形
                    if(startDraw){
                        var endX = x;
                        var endY = y;
                        context.beginPath();
                        context.clearRect(0,0,canvas.width,canvas.height);
                        context.moveTo(startX, startY);
                        context.lineTo(endX, startY);
                        context.lineTo(endX, endY);
                        context.lineTo(startX, endY);
                        context.lineTo(startX, startY);
                        var lineXY = startX + "," + startY + "#" + endX + "," + endY;
                        coOordinates = toolType + "#" + lineXY;
                        context.closePath();
                        context.stroke();

                        parent._preImage(beforeLineImage,function(imgs){
                            context.drawImage(imgs,0,0,canvas.width,canvas.height);
                        });
                    }
                }else if (toolType == 4) {	//直线 (技巧：保存画直线前的旧图 线条在前端移动的过程中不断地补充旧图)
                    if(startDraw){
                        var endX = x;
                        var endY = y;
                        context.beginPath();
                        context.clearRect(0,0,canvas.width,canvas.height);
                        context.moveTo(startX, startY);
                        context.lineTo(endX, endY);
                        var lineXY = startX + "," + startY + "#" + endX + "," + endY;
                        coOordinates = toolType + "#" + lineXY;
                        context.stroke();

                        parent._preImage(beforeLineImage,function(imgs){
                            context.drawImage(imgs,0,0,canvas.width,canvas.height);
                        });
                    }
                }else if (toolType==5) {	//箭头
                    if(startDraw){
                        var endX = x;
                        var endY = y;
                        //第1步.画线
                        context.beginPath();
                        context.clearRect(0,0,canvas.width,canvas.height);
                        context.moveTo(startX, startY);
                        context.lineTo(endX, endY);
                        context.fill();
                        context.stroke();
                        context.save();

                        //第2步.箭头
                        var arr = parent._jisuan(startX, startY, endX, endY);//设定开始点。
                        context.moveTo(arr[0], arr[1]);
                        context.lineTo(endX, endY);
                        context.lineTo(arr[2], arr[3]);
                        //下面这个计算是用来在箭头与虚线的交叉点。直角三角形计算原理。。
                        var lineSize = context.lineWidth;
                        var newArrow1 = (lineSize == 1 || lineSize == 2) ? 5 : arrow1;
                        context.lineTo(endX-parseInt(newArrow1*Math.cos(arr[4]*Math.PI/180)), endY-parseInt(newArrow1*Math.sin(arr[4]*Math.PI/180)));
                        context.lineTo(arr[0], arr[1]);
                        context.fill(); //箭头是个封闭图形
                        context.closePath();
                        context.stroke();

                        var lineXY = startX + "," + startY + "#" + endX + "," + endY;
                        coOordinates = toolType + "#" + lineXY;

                        parent._preImage(beforeLineImage,function(imgs){
                            context.drawImage(imgs,0,0,canvas.width,canvas.height);
                        });
                    }
                }

            }
        },false);
        /** 触屏,手指离开屏幕 */
        $(drawingCanvas)[0].addEventListener('touchend',function(event){
            var toolsIsOn =  WhiteBoardManagerModule.instance.whiteboardToolsIsOn();
            if(!toolsIsOn) return;
            //if($("#v-box-canvas-tools").css("display") == "none") return;
            startDraw = false;
            //画笔选择第一种方案时要去掉 toolType!=0 的条件
            if(toolType != 1 && toolType != 6)
            {
                context.beginPath();
                if(coOordinates.length > 5000) {
                    splitPoints = coOordinates.split('#');
                    newCoordinates = "" + toolType;
                    for(i=1;i<splitPoints.length;i++)
                    {
                        newCoordinates += "#" +splitPoints[i];
                        if(newCoordinates.length > 500)
                        {
                            newCoordinates =  newCoordinates;

                            pixels.push(newCoordinates.toString());
                            newCoordinates = "" + toolType;
                            i-=2;
                        }
                    }
                    if(i >= splitPoints.length)
                    {
                        newCoordinates =  newCoordinates;
                        pixels.push(newCoordinates.toString());
                        newCoordinates = "" + toolType;
                    }
                    $("#drawing-canvus").trigger("drawmultiple", pixels);
                }
                else {
                    coOordinates =  coOordinates;
                    $("#drawing-canvus").trigger("draw", coOordinates);
                    coOordinates = "" + toolType;
                }
            }
        },false);

		$(drawingCanvas).mousedown(function (e) {       //鼠标点击绑定事件
            if(WhiteBoardManagerModule.instance._detectmob())return;
			context.beginPath();
			WhiteBoardManagerModule.instance.colorOff();
			WhiteBoardManagerModule.instance.lineOff();
		//	WhiteBoardManagerModule.instance.fontOff();
			var toolsIsOn =  WhiteBoardManagerModule.instance.whiteboardToolsIsOn();
			if(!toolsIsOn) return;
			var mousePos = parent._getMousePos(e);
			var downStartX =  mousePos.x;
			var downStartY = mousePos.y;
			startX = mousePos.x;
			startY = mousePos.y;
			

			context.lineWidth = parent._getLineWidth();
			context.strokeStyle = parent._getCurrentColor();
		//	context.fillStyle = parent._getCurrentColor();
			startDraw = true;
			// TODO::!!! Warnning, this global var should be remove or refactor to some object.
			coOordinates = "" + toolType;
			
//			if(toolType == 0){	//画笔 第2个方案
//				var startXY = toolType + "#" + downStartX + "," + downStartY + "#1";
//				$(drawingCanvas).trigger("draw", startXY);
//			}
			if(toolType == 1){	//橡皮擦
				var size = context.lineWidth;
				context.clearRect(downStartX - size * eraserXY ,  downStartY - size * eraserXY , size * eraserSize, size * eraserSize);
				context_show.clearRect(downStartX - size * eraserXY ,  downStartY - size * eraserXY , size * eraserSize, size * eraserSize);
				var eraserMessage = toolType + "#" + downStartX + "," + downStartY;
				$(drawingCanvas).trigger("draw", eraserMessage);
			}
			if(toolType == 2 || toolType == 3 || toolType == 4 || toolType == 5) {
				beforeLineImage = canvas.toDataURL("image/png");
			}
			if(toolType == 6){	//文本
                if(!WhiteBoardManagerModule.instance.fontIsOn()){
                    return;
                }
				textValue = $("#txtText").val();
				if(textValue=="" || textValue == null){
					//alert("请先输入文本内容");
                    var msg = VC.ROUTER.LIVEBIG.WHITEBOARDMANAGER_INPUT_TEXT;
                    WhiteBoardManagerModule.instance.showMessageWindow(msg);
					return;
				}
				context_show.font="normal " + ((parseInt(context.lineWidth) * 6)<10 ? 10 : (parseInt(context.lineWidth) * 6)) + "px arial";
				var textMessage = toolType + "#" + downStartX + "," + downStartY + "#" + textValue;
				$(drawingCanvas).trigger("draw", textMessage);
				context_show.fillText(textValue, downStartX, downStartY);
			//	toolType = 0;
			//	$("#txtText").val("");
			}
		});
		
		$(drawingCanvas).mousemove(function (e) {
            if(WhiteBoardManagerModule.instance._detectmob())return;
			if (e.target.getAttribute("id") != "drawing-canvus") return;
			var toolsIsOn =  WhiteBoardManagerModule.instance.whiteboardToolsIsOn();
			if(!toolsIsOn) return;
			context.lineWidth = parent._getLineWidth();
			context.strokeStyle = parent._getCurrentColor();
			context.fillStyle = parent._getCurrentColor();
			var mousePos = parent._getMousePos(e);
//			var endX = mousePos.x;
//			var endY = mousePos.y;
			if (toolType == 0) {	//画笔
				if(startDraw){
					//第1方案 鼠标松开时菜发送坐标 
					var endX = mousePos.x;
					var endY = mousePos.y;
					context.lineTo(endX, endY);
					coOordinates += "#" + endX + "," + endY;
					context.stroke();
					
					//第2方案 鼠标移动时菜发送坐标
//					var tempXY = toolType + "#" + endX + "," + endY + "#0";
//					$(drawingCanvas).trigger("draw", tempXY);
				}
			}
			else if (toolType==1) { //橡皮擦
				var endX = mousePos.x;
				var endY = mousePos.y;
				var size = context.lineWidth;
				canvas_top_context.clearRect(0,0,canvas_top.width,canvas_top.height);
				canvas_top_context.beginPath();			
				canvas_top_context.strokeStyle =  '#000000';						
				canvas_top_context.moveTo(endX - size * eraserXY, endY - size * eraserXY);						
				canvas_top_context.lineTo(endX + size * eraserXY, endY - size * eraserXY);
				canvas_top_context.lineTo(endX + size * eraserXY, endY + size * eraserXY);
				canvas_top_context.lineTo(endX - size * eraserXY, endY + size * eraserXY);
				canvas_top_context.lineTo(endX - size * eraserXY, endY - size * eraserXY);	
				canvas_top_context.stroke();
				
				if(startDraw){
					context.clearRect(endX - size * eraserXY,  endY - size * eraserXY, size * eraserSize, size * eraserSize);
					context_show.clearRect(endX - size * eraserXY,  endY - size * eraserXY, size * eraserSize, size * eraserSize);
					coOordinates = toolType + "#" + endX + "," + endY;
					$(drawingCanvas).trigger("draw", coOordinates);
				}
			}
			else if (toolType==2) {	//圆
				if(startDraw){
					var endX = mousePos.x;
					var endY = mousePos.y;
					context.beginPath();
					var k = ((endX-startX)/0.75)/2,
						w = (endX-startX)/2,
						h = (endY-startY)/2;
					context.clearRect(0,0,canvas.width,canvas.height);
					context.moveTo(startX, parseFloat(startY-h));
					context.bezierCurveTo(parseFloat(startX+k), parseFloat(startY-h), parseFloat(startX+k), parseFloat(startY+h), startX, parseFloat(startY+h));
					context.bezierCurveTo(parseFloat(startX-k), parseFloat(startY+h), parseFloat(startX-k), parseFloat(startY-h), startX, parseFloat(startY-h));
					var lineXY = startX + "," + startY + "#" + endX + "," + endY;
					coOordinates = toolType + "#" + lineXY;
					context.closePath();
					context.stroke();
					
					parent._preImage(beforeLineImage,function(imgs){
						context.drawImage(imgs,0,0,canvas.width,canvas.height);
			        });
				}
			}
			else if (toolType == 3) {	//方形
				if(startDraw){
					var endX = mousePos.x;
					var endY = mousePos.y;
					context.beginPath();
					context.clearRect(0,0,canvas.width,canvas.height);
					context.moveTo(startX, startY);						
					context.lineTo(endX, startY);
					context.lineTo(endX, endY);
					context.lineTo(startX, endY);
					context.lineTo(startX, startY);
					var lineXY = startX + "," + startY + "#" + endX + "," + endY;
					coOordinates = toolType + "#" + lineXY;
					context.closePath();
					context.stroke();
					
					parent._preImage(beforeLineImage,function(imgs){
						context.drawImage(imgs,0,0,canvas.width,canvas.height);
			        });
				}
			}
			else if (toolType == 4) {	//直线 (技巧：保存画直线前的旧图 线条在前端移动的过程中不断地补充旧图)
				if(startDraw){
					var endX = mousePos.x;
					var endY = mousePos.y;
					context.beginPath();
					context.clearRect(0,0,canvas.width,canvas.height);
					context.moveTo(startX, startY);
					context.lineTo(endX, endY);
					var lineXY = startX + "," + startY + "#" + endX + "," + endY;
					coOordinates = toolType + "#" + lineXY;
					context.stroke();
					
					parent._preImage(beforeLineImage,function(imgs){
						context.drawImage(imgs,0,0,canvas.width,canvas.height);
			        });
				}
			}
			else if (toolType==5) {	//箭头
				if(startDraw){
					var endX = mousePos.x;
					var endY = mousePos.y;
					//第1步.画线
					context.beginPath();
					context.clearRect(0,0,canvas.width,canvas.height);
					context.moveTo(startX, startY);
					context.lineTo(endX, endY);
					context.fill();
					context.stroke();
					context.save();

					//第2步.箭头
					var arr = parent._jisuan(startX, startY, endX, endY);//设定开始点。
					context.moveTo(arr[0], arr[1]);
					context.lineTo(endX, endY)
					context.lineTo(arr[2], arr[3]);
					//下面这个计算是用来在箭头与虚线的交叉点。直角三角形计算原理。。
					var lineSize = context.lineWidth;
					var newArrow1 = (lineSize == 1 || lineSize == 2) ? 5 : arrow1;
					context.lineTo(endX-parseInt(newArrow1*Math.cos(arr[4]*Math.PI/180)), endY-parseInt(newArrow1*Math.sin(arr[4]*Math.PI/180)));
					context.lineTo(arr[0], arr[1]);
					context.fill(); //箭头是个封闭图形  
					context.closePath();
					context.stroke();
					
					var lineXY = startX + "," + startY + "#" + endX + "," + endY;
					coOordinates = toolType + "#" + lineXY;
					
					parent._preImage(beforeLineImage,function(imgs){
						context.drawImage(imgs,0,0,canvas.width,canvas.height);
			        });
				}
			}
		});
		
		$(drawingCanvas).mouseup(function () {
            if(WhiteBoardManagerModule.instance._detectmob())return;
			var toolsIsOn =  WhiteBoardManagerModule.instance.whiteboardToolsIsOn();
			if(!toolsIsOn) return;
			//if($("#v-box-canvas-tools").css("display") == "none") return;
			startDraw = false;
			//画笔选择第一种方案时要去掉 toolType!=0 的条件
			if(toolType != 1 && toolType != 6)
			{
				context.beginPath();
				if(coOordinates.length > 5000) {
					splitPoints = coOordinates.split('#');
					newCoordinates = "" + toolType;
					for(i=1;i<splitPoints.length;i++)
					{
						newCoordinates += "#" +splitPoints[i];
						if(newCoordinates.length > 500)
						{
							newCoordinates =  newCoordinates;

							pixels.push(newCoordinates.toString());
							newCoordinates = "" + toolType;
							i-=2;
						}
					}
					if(i >= splitPoints.length)
					{
						newCoordinates =  newCoordinates;
						pixels.push(newCoordinates.toString());
						newCoordinates = "" + toolType;
					}
					$("#drawing-canvus").trigger("drawmultiple", pixels);
				}
				else {
					coOordinates =  coOordinates;
					$("#drawing-canvus").trigger("draw", coOordinates);
					coOordinates = "" + toolType;
				}
			}
		});
		
		$(drawingCanvas).mouseout(function () {
			var toolsIsOn =  WhiteBoardManagerModule.instance.whiteboardToolsIsOn();
			if(!toolsIsOn) return;
			//if($("#v-box-canvas-tools").css("display") == "none") return;
			canvas_top_context.clearRect(0,0,canvas_top.width,canvas_top.height);
			if(startDraw){
				startDraw = false;
				canvas.focus();
				parent._doMouse();
			}
		});
		
		$(drawingCanvas).bind("screenchage", function (event, xy) {
			var arrXY = xy.split(",");
			var screenImage = canvas_show.toDataURL("image/png");
			canvas.width = arrXY[0];
			canvas.height = arrXY[1];
			canvas_show.width = arrXY[0];
			canvas_show.height = arrXY[1];
			canvas_top.width=arrXY[0];
			canvas_top.height=arrXY[1];

			var rgb = parent._getCurrentColor();
			context_show.strokeStyle = rgb;
			context_show.fillStyle = rgb;
			context_show.lineWidth = parent._getLineWidth();
			
			parent._preImage(screenImage,function(imgs){
                //context_show.drawImage(this,0,0,canvas_show.width,canvas_show.height);
                context_show.drawImage(imgs,0,0,canvas_show.width,canvas_show.height);
                // roomid = WhiteBoardManagerModule.instance.classRoomController.classRoomID;
                //var userid = WhiteBoardManagerModule.instance.classRoomController.userID;
                //var command = {"roomid":roomid,"cmd":"whiteboard:getpage","userid":userid,"pageno":1,"typeid":0};
                //WhiteBoardManagerModule.instance.classRoomController.sendMessage(command);
                WhiteBoardManagerModule.instance._sendPageMessage("getpage", 0);
	        });

		});
		
	//======================= start send message bind =====================
		$(drawingCanvas).bind("draw", function (event, xy) {
			if(xy.length <= 1) return;	// avoid the single click to send message to the server.
			parent._sendPixelMessage("done", toolType, "", xy, true, 0);	// sent the coordinate infomation to the server per coordinate.
		});
		var currentIndex = 0;
		$(drawingCanvas).bind("drawmultiple", function (event, xy) {
			currentIndex = 0;
			if(pixels[currentIndex].lenght <= 1) return;
			parent._sendPixelMessage("done", toolType, "", pixels[currentIndex], true, 0);	// !!! performance point here to optimize
		});
	//======================= end send message bind ======================
	//======================= start receive message bind =====================
		$(drawingCanvas).bind("drawoperate", function (event, data) {
			if(data == "error"){
				console.log("data error");
				return;
			}
			var jsonData = JSON.parse(data);

			if(jsonData.cmd == "classroom:join"){
                classroomName = jsonData.classroom.name;
				members = jsonData.members;
				isClass = jsonData.controlpanel.inclass;		//当前老师课程模式，0为授课，1为讨论
                if(jsonData.classroom.quota === 1){
                    isClass = 1;
                }
				shareWhiteboard = jsonData.controlpanel.sharewhiteboard;		//是否共享白板操作(工具条)
				if(WhiteBoardManagerModule.instance.classRoomController.userID == jsonData.userid){		//判断是否自己
					parent._showWhiteboard(jsonData.show);
					if(jsonData.show)
						parent.setShareWhiteboard(jsonData.controlpanel.sharewhiteboard==1);
					
			    		currentPage = parseInt(jsonData.pageno,10);
				    	var imgSrc = parent._getImageSrc(currentPage);
					if(imgSrc != "")
				    		parent._loadBackCanvasImgae(imgSrc);

                    if(!jsonData.isteacher && jsonData.classroom.quota > 10 && jsonData.classroom.ispublic && jsonData.isauth == 0){
                        WhiteBoardManagerModule.instance.whiteboardToolsOff();
                    }
				    	WhiteBoardManagerModule.instance.initWhiteboardPage(currentPage, totalPage);
				    	parent._sendPageMessage("getpage", 0);
		    		}
			}
			else if(jsonData.cmd == "whiteboard:done"){
				if(jsonData.typeid == 7){	//清屏
					parent._clearCanvas();
					parent._clearCanvasShow();
				}
				else if(jsonData.typeid == 8){	//白板显示\隐藏控制
					parent._showWhiteboard(jsonData.show);
					if(jsonData.show)
						parent.setShareWhiteboard(jsonData.controlpanel.sharewhiteboard==1);
				}
				else{
					parent._drawPoints(data, false);	// just use in here, should be refactor in the comming on.
				}
			}
			else if(jsonData.cmd == "whiteboard:page"){	// !!! this status is useless, it used to restore the scene before, now it replaced by 'whiteboard:getpage'
				currentPage = parseInt(jsonData.pageno);
				var backimgsrc = parent._getImageSrc(currentPage);
				if(backimgsrc != "")
					parent._loadBackCanvasImgae(backimgsrc);
		    	
		    	if(jsonData.bginfo != null && jsonData.bginfo != "" && jsonData.bginfo != undefined){
			    	parent._preImage(jsonData.bginfo,function(imgs){
			    		context.drawImage(imgs,0,0,canvas.width,canvas.height);
			        });
		    	}
			}
			else if(jsonData.cmd == "whiteboard:getpage"){
                var userid = WhiteBoardManagerModule.instance.classRoomController.userID;
                if(userid!=jsonData.userid && jsonData.typeid == 0){    //排除别人且非翻页
                    return;
                }
				parent._clearCanvas();	//先清理画板再画 
				parent._clearCanvasShow();
				currentPage = parseInt(jsonData.pageno);
				var backimgsrc = parent._getImageSrc(currentPage);
				if(backimgsrc != "")
					parent._loadBackCanvasImgae(backimgsrc);
				if(jsonData.datas == "" || jsonData.datas == null) return;
				 var len = jsonData.datas.length;
				 if(len <= 0) return;
			    	for(var i=0; i<len; i++){
					parent._drawPoints(jsonData.datas[i], true);
			    	}
				
			}
			else if(jsonData.cmd == "whiteboard:init"){	// !!! useless path, it should be remove in the coming on.
				//收到新登录用户的初始化白板请求后老师当前页面生成所需信息
				if(parent.classRoomController.userID == jsonData.memberid){
					var title = $(".btn-menu dd.on").attr("title");
					var show = $("#v-box-canvas").css("display") != "none";
					var status = $("#v-box-canvas-tools").css("display") != "none"?1:0;
					var drawCanvas = $("#drawing-canvus");
				    var image = drawCanvas[0].toDataURL("image/png");
					parent._sendPixelMessage("getinit", status, image, "", show, jsonData.userid);
				}
			}
			else if(jsonData.cmd == "whiteboard:getinit"){
				//初始化时取当前老师页面进行加载
				if(parent.classRoomController.userID == jsonData.memberid){
					parent._showWhiteboard(jsonData.show);
					if(jsonData.show)
						parent.setShareWhiteboard(jsonData.typeid==1);
				    	if(jsonData.bginfo != null && jsonData.bginfo != "" && jsonData.bginfo != undefined){
					    	parent._preImage(jsonData.bginfo,function(imgs){
					    		context.drawImage(imgs,0,0,canvas.width,canvas.height);
					        	});
				    	}
		    		}
			}else if(jsonData.cmd == "controlpanel:inclass"){
				isClass = parseInt(jsonData.status);
			}
			else if(jsonData.cmd == "controlpanel:sharewhiteboard"){
				shareWhiteboard = jsonData.status
			}
			else if(jsonData.cmd == "userctrl:stopwhiteboard"){
				if(parent.classRoomController.userID == jsonData.userid && parent.classRoomController.role == "2"){
					if(jsonData.status == 1){
						//$("#v-box-canvas-tools").show();
						if(isClass==1){
							WhiteBoardManagerModule.instance.whiteboardToolsOn();
							WhiteBoardManagerModule.instance.whiteboardShareOn();
						}else{
							WhiteBoardManagerModule.instance.whiteboardToolsOff();
							WhiteBoardManagerModule.instance.whiteboardShareOff();
						}
					}else{
						//$("#v-box-canvas-tools").hide();
						WhiteBoardManagerModule.instance.whiteboardToolsOff();
						WhiteBoardManagerModule.instance.whiteboardShareOff();
					}
		    	}
				/*for(var i=0; i<members.length; i++){
					if(members[i].userid == parseInt(parent.classRoomController.userID)){
						members[i].stopwhiteboard = jsonData.status;
					}
				}*/
				WhiteBoardManagerModule.instance.setMemberStopwhiteboard(jsonData.status,jsonData.userid);
			}
			else if(jsonData.cmd == "robot:imgsupdate"){
                WhiteBoardManagerModule.instance.coursewareTransformation(jsonData);
				currentPage=1;
				parent._clearCanvas();
				parent._clearCanvasShow();
				parent._initPage();
				parent._sendPixelMessage("cleanimgs", 0, "", "", true, 0);
			}/*else if(jsonData.error == "duplicated_member"){
				//alert("请不要重复登录!");
        //        $('#reLoginMessage').modal({opacity:50,overlayCss: {backgroundColor:"#000000"},position:['40%',]});
                setTimeout(function(){
                    window.open('', '_self', '');
                    window.close();
                },1500);
				*//*top.window.opener = top;
				top.window.open('','_self','');
				top.window.close();*//*
			}*/
			
			if (currentIndex < pixels.length - 1) {
				currentIndex++;
				if(pixels[currentIndex].lenght <= 1) return;
				parent._sendPixelMessage("done", toolType, "", pixels[currentIndex], true, 0);
			}
			else {
				currentIndex = 0;
				pixels = new Array();
			}
		});
	},
	setMemberStopwhiteboard:function(status,userid){
		//TODO::设置列表对应用户的白板状态
	},
    coursewareTransformation:function(documentindex,total){
        //TODO::课件转换进度
    },
	_jisuan:function(jStartX, jStartY, jEndX, jEndY) {	// caculate the angle of the arrow.
		var lineSize = context.lineWidth;
		var newArrow2 = (lineSize == 1 || lineSize == 2) ? 25 : arrow2;
		var newArrowAngle = (lineSize == 1 || lineSize == 2) ? 15 : arrowAngle;
		var angle = parseInt(Math.atan2(jEndY-jStartY,jEndX-jStartX)/Math.PI*180);
		var arr = [];
		arr[0] = jEndX - parseInt(newArrow2 * Math.cos(Math.PI/180*(angle - newArrowAngle)));
		arr[1] = jEndY - parseInt(newArrow2 * Math.sin(Math.PI/180*(angle - newArrowAngle)));
		arr[2] = jEndX - parseInt(newArrow2 * Math.cos(Math.PI/180*(angle + newArrowAngle)));
		arr[3] = jEndY - parseInt(newArrow2 * Math.sin(Math.PI/180*(angle + newArrowAngle)));
		arr[4] = angle
		return arr;
	},

	
	//绑定分页事件
	_bindPageEvent:function(first, prev, next, last){
		//TODO::以后要修改绑定的翻页事件
		var parent = this;
		$(first).click(function () {
			if(totalPage==0){
				//parent.classRoomController.popupMessage("当前已是首页！");
				//alert("当前已是首页！");
                var msg = VC.ROUTER.LIVEBIG.WHITEBOARDMANAGER_FIRST_PAGE;
                WhiteBoardManagerModule.instance.showMessageWindow(msg);
                //$('#firstPageMessage').modal({opacity:100,overlayCss: {backgroundColor:"#000000"},position:["40%",]});
				return;
			}
			oldPage = currentPage;
			currentPage=1;
			//var drawCanvas = $("#drawing-canvus");
		    //var image = drawCanvas[0].toDataURL("image/png");
			var firstSrc = parent._getImageSrc(currentPage);
			if(firstSrc != "")
				parent._loadBackCanvasImgae(firstSrc);

			//$("#currPage").html("<strong>"+currentPage+"</strong>/"+totalPage+"页");
			WhiteBoardManagerModule.instance.initWhiteboardPage(currentPage, totalPage);
//			parent._clearCanvas();
//			parent._sendPixelMessage("done", 7, "", "7#0,0", true, 0);
//			parent._sendPixelMessage("page", 2, image, "", true, 0);
			parent._sendPageMessage("getpage", 1);	
		});
		
		
		
		$(prev).click(function () {
			if(currentPage==1){
				//parent.classRoomController.popupMessage("当前已是第一页！");
				//alert("当前已是第一页!");
                var msg = VC.ROUTER.LIVEBIG.WHITEBOARDMANAGER_FIRST_PAGE;
                WhiteBoardManagerModule.instance.showMessageWindow(msg);
                //$('#firstPageMessage').modal({opacity:100,overlayCss: {backgroundColor:"#000000"},position:["40%",]});
				return;
			}
			var drawCanvas = $("#drawing-canvus");
		    var image = drawCanvas[0].toDataURL("image/png");
			currentPage = parseInt(currentPage) - 1;
			var prevSrc = parent._getImageSrc(currentPage);
			if(prevSrc != "")
				parent._loadBackCanvasImgae(prevSrc);

			//$("#currPage").html("<strong>"+currentPage+"</strong>/"+totalPage+"页");
			WhiteBoardManagerModule.instance.initWhiteboardPage(currentPage, totalPage);
//			parent._clearCanvas();
//			parent._sendPixelMessage("done", 7, "", "7#0,0", true, 0);
//			parent._sendPixelMessage("page", 0, image, "", true, 0);
			parent._sendPageMessage("getpage", 1);
		});
		
		$(next).click(function () {
			if(currentPage==totalPage || totalPage == 0){
				//parent.classRoomController.popupMessage("当前已是最后一页！");
				//alert("当前已是尾页!");
                var msg = VC.ROUTER.LIVEBIG.WHITEBOARDMANAGER_LAST_PAGE;
                WhiteBoardManagerModule.instance.showMessageWindow(msg);
                //$('#lastPageMessage').modal({opacity:100,overlayCss: {backgroundColor:"#000000"},position:["40%",]});
				return;
			}
			var drawCanvas = $("#drawing-canvus");
		    var image = drawCanvas[0].toDataURL("image/png");
			currentPage = parseInt(currentPage) + 1;
			var nextSrc = parent._getImageSrc(currentPage);
			if(nextSrc != "")
				parent._loadBackCanvasImgae(nextSrc);
	        
			//$("#currPage").html("<strong>"+currentPage+"</strong>/"+totalPage+"页");
			WhiteBoardManagerModule.instance.initWhiteboardPage(currentPage, totalPage);
//			parent._clearCanvas();
//			parent._sendPixelMessage("done", 7, "", "7#0,0", true, 0);
//			parent._sendPixelMessage("page", 1, image, "", true, 0);
			parent._sendPageMessage("getpage", 1);
		});
		
		
		
		$(last).click(function () {
			if(totalPage==0){
				//parent.classRoomController.popupMessage("当前已是尾页！");
				//alert("当前已是尾页！");
                var msg = VC.ROUTER.LIVEBIG.WHITEBOARDMANAGER_LAST_PAGE;
                WhiteBoardManagerModule.instance.showMessageWindow(msg);
                //$('#lastPageMessage').modal({opacity:100,overlayCss: {backgroundColor:"#000000"},position:["40%",]});
				return;
			}
			oldPage = currentPage;
			currentPage = parseInt(totalPage);
			var drawCanvas = $("#drawing-canvus");
		    var image = drawCanvas[0].toDataURL("image/png");
			var lastSrc = parent._getImageSrc(currentPage);
			if(lastSrc != "")
				parent._loadBackCanvasImgae(lastSrc);

			//$("#currPage").html("<strong>"+currentPage+"</strong>/"+totalPage+"页");
			WhiteBoardManagerModule.instance.initWhiteboardPage(currentPage,totalPage);
//			parent._clearCanvas();
//			parent._sendPixelMessage("done", 7, "", "7#0,0", true, 0);
//			parent._sendPixelMessage("page", 3, image, "", true, 0);
			parent._sendPageMessage("getpage", 1);
		});
	},
	
	/*whiteboardChange:function(){
        
	},*/
    setToolType:function(value){
        toolType = value;
    },
    showMessageWindow:function(msg){
        //TODO::弹出提示框
    },
	updateClassroomMode:function(isClass){
		//TODO::记录课程类型	
	},
	whiteboardIsOn:function(){
		//TODO::白板是否开启
	},
	whiteboardShareOn:function(){
		//TODO::白板共享开启
	},
	whiteboardShareOff:function(){
		//TODO::白板共享关闭
	},
    setTeaWhiteboardStatus:function(status){
        //TODO::设置老师是否开启白板状态
    },
    getTeaWhiteboardStatus:function(){
        //TODO::获取老师是否开启白板状态
    },
    getWhiteBoardIsShareStatus:function(){
        //TODO::获取是否共享白板状态
    },
    openOrCloseWhiteboard:function(){       //打开或关闭白板
        var parent = this;
        if(parseInt(WhiteBoardManagerModule.instance.classRoomController.role, 10) == 2)
            return;
        var show = false;
        if(parseInt(WhiteBoardManagerModule.instance.classRoomController.role, 10)==1){	// 1 - teacher
            var whiteboardIsOn =  WhiteBoardManagerModule.instance.whiteboardIsOn();
            if(whiteboardIsOn){	// act to hiden then canvas of the WB
                //$("#v-box-canvas").hide();
                //$("#v-box-canvas-tools").hide();
                WhiteBoardManagerModule.instance.whiteboardOff();		//关闭白板,显示视频
                WhiteBoardManagerModule.instance.whiteboardToolsOff();	//关闭工具条
                WhiteBoardManagerModule.instance.whiteboardShareOff();
                show = false;
            //    $(".center-main #teacher_a").css('max-width',$("#divVideoRemote").width());
            }
            else{
                //$("#v-box-canvas").show();
                //$("#v-box-canvas-tools").show();

                WhiteBoardManagerModule.instance.whiteboardOn();		//开启白板,关闭视频
                WhiteBoardManagerModule.instance.whiteboardToolsOn();	//开启工具条
//    					$("#pageid").show();
//    					$("#curcolor").show();
                show = true;

                //$("#divVideoRemote").hide();	//隐藏视频

                //console.log("fefwfwefwfwfw" + isClass);
                if(isClass == 1){	//讨论模式
                    WhiteBoardManagerModule.instance.updateClassroomMode(isClass);
                    //$("#sharewhiteboard").removeClass("op").addClass("share");		//可点状态
                }

//    					if(imageArray == undefined || imageArray.length <= 0){
//    						parent.classRoomController.popupMessage("目前没上传课件，若要在课件上操作画板，请先上传课件！");
//    					}
            }
            WhiteBoardManagerModule.instance.setTeaWhiteboardStatus(show);
            //TODO:发送显示隐藏白板命令
            WhiteBoardManagerModule.instance._sendPixelMessage("done", 8, "", "8#1,1", show, 0);	// 8#1,1 - useless, just for the judgement of the length to avoid send message incorrectly.

            return true;
        }
        else
            return false;
    },
	_bindControlEvent:function(){	//白板切换,废弃
//        var parent = this;
//        //白板视频切换
//        $("#whiteboard").click(function(){
//
//        });
	},
	
// ======================== end 事件版定 =======================
	
//======================== start 鼠标执行画板mouseup mouseout事件 ============ 
	_doMouse:function(){
		context.beginPath();
		if(coOordinates.length > 5000) { // cut the drawing path by while the size is more than 5000 cut with 500 per sequence.
			splitPoints = coOordinates.split('#');
			newCoordinates = "" + toolType;
			for(i=1;i<splitPoints.length;i++)
			{
				// append the cooridinate until it less than 500, to make the coordinates send to server keep less than 500 a row in that sequence.
				newCoordinates += "#" +splitPoints[i];
				if(newCoordinates.length > 500)
				{
					newCoordinates =  newCoordinates;

					pixels.push(newCoordinates.toString());
					newCoordinates = "" + toolType;
					i-=2;	// back 2 step to make the drawing seems more continuiously why 2? test it in the comimg soon.
				}
			}
			// keep the rest coodrinates less than 500 
			if(i >= splitPoints.length)
			{
				newCoordinates =  newCoordinates;
				pixels.push(newCoordinates.toString());
				newCoordinates = "" + toolType;
			}
			$("#drawing-canvus").trigger("drawmultiple", pixels);
		}
		else {
			coOordinates =  coOordinates;
			$("#drawing-canvus").trigger("draw", coOordinates);
			coOordinates = "" + toolType;
		}
	},
//======================== end 鼠标执行画板mouseup mouseout事件 ============ 
	
// =========================== Start 接收画板动作 =======================
	_drawPoints:function(data, isJson) {
		var jsonData = isJson ? data : JSON.parse(data);
	    
	    var ink = !isNaN(jsonData.typeid) ? parseInt(jsonData.typeid) : 0;
	    var allxy = jsonData.coordinate.split('#');
	    if(allxy.length > 1)
	    {
	    	var arrwh = jsonData.widthheight.split(',');
	    	var oldwidth = parseInt(arrwh[0], 10);
    		var oldheight = parseInt(arrwh[1], 10);
    		
    		if(ink == 1){		//橡皮檫
    			context_show.beginPath();
    			context_show.lineWidth = parseInt(jsonData.size);
    			context_show.strokeStyle = jsonData.color;
    			context_show.fillStyle = jsonData.color;
    			
	        	var xy = allxy[1].split(",");
	        	var size = context_show.lineWidth;
	    	    var x=(canvas.width*xy[0])/oldwidth;
	    	    var y=(canvas.height*xy[1])/oldheight;
	    	    
	    	    context_show.clearRect(parseInt(x) - size * eraserXY,  parseInt(y) - size * eraserXY, size * eraserSize, size * eraserSize);
	        }
	        else if(ink == 2){	//圆
	        	context_show.beginPath();
	        	context_show.lineWidth = parseInt(jsonData.size);
	        	context_show.strokeStyle = jsonData.color;
	        	context_show.fillStyle = jsonData.color;
	        	
	        	var cStartXY = allxy[1];
	        	var cEndXY = allxy[2];
	        	if(cStartXY != "" && cEndXY != ""){
	        		circleStartXY = cStartXY.split(",");
	        	circleEndXY = cEndXY.split(",");
	        	    
	        	    circleStartX = parseFloat((canvas.width*parseInt(circleStartXY[0]))/oldwidth);
	        		circleStartY = parseFloat((canvas.height*parseInt(circleStartXY[1]))/oldheight);
	        	    circleEndX = parseFloat((canvas.width*parseInt(circleEndXY[0]))/oldwidth);
	        	    circleEndY = parseFloat((canvas.height*parseInt(circleEndXY[1]))/oldheight);
	        	    
	        	    var k = ((circleEndX-circleStartX)/0.75)/2,
	    				w = (circleEndX-circleStartX)/2,
	    				h = (circleEndY-circleStartY)/2;
	        	    context_show.moveTo(circleStartX, parseFloat(circleStartY-h));
	        	    context_show.bezierCurveTo(parseFloat(circleStartX+k), parseFloat(circleStartY-h), parseFloat(circleStartX+k), parseFloat(circleStartY+h), circleStartX, parseFloat(circleStartY+h));
	        	    context_show.bezierCurveTo(parseFloat(circleStartX-k), parseFloat(circleStartY+h), parseFloat(circleStartX-k), parseFloat(circleStartY-h), circleStartX, parseFloat(circleStartY-h));
	        	    context_show.closePath();
	        	    context_show.stroke();
	        	}
	        }
	        else if(ink == 3){	//方形
	        	context_show.beginPath();
	        	context_show.lineWidth = parseInt(jsonData.size);
	        	context_show.strokeStyle = jsonData.color;
	        	context_show.fillStyle = jsonData.color;
	        	
	        	var fStartXY = allxy[1];
	        	var fEndXY = allxy[2];
	        	if(fStartXY != "" && fEndXY != ""){
	        		var sxy = fStartXY.split(",");
	        	    var fStartX = (canvas.width*sxy[0])/oldwidth;
	        	    var fStartY = (canvas.height*sxy[1])/oldheight;
	        	    var exy = fEndXY.split(",");
	        	    var fEndX = (canvas.width*exy[0])/oldwidth;
	        	    var fEndY = (canvas.height*exy[1])/oldheight;
	        	    context_show.lineTo(fEndX, fStartY);
	        	    context_show.lineTo(fEndX, fEndY);
	        	    context_show.lineTo(fStartX, fEndY);
	        	    context_show.lineTo(fStartX, fStartY);
	        	    context_show.closePath();
	        	    context_show.stroke();
	        	}
	        }
	        else if(ink == 4){	//直线
	        	context_show.beginPath();
	        	context_show.lineWidth = parseInt(jsonData.size);
	        	context_show.strokeStyle = jsonData.color;
	        	context_show.fillStyle = jsonData.color;

		        for (i = 1; i < allxy.length; i++) {
		            var lxy = allxy[i];
		            if (lxy != "") {
		                this._drawPoint(arrwh,lxy);
		            }
		        }
	        }
	        else if(ink == 5){	//箭头
	        	context_show.beginPath();
	        	context_show.lineWidth = parseInt(jsonData.size);
	        	context_show.strokeStyle = jsonData.color;
	        	context_show.fillStyle = jsonData.color;
	        	
	        	var aStartXY = allxy[1];
	        	var aEndXY = allxy[2];
	        	if(aStartXY != "" && aEndXY != ""){
	        		var arrowStartXY = aStartXY.split(",");
	        		var arrowStartX = (canvas.width*parseInt(arrowStartXY[0]))/oldwidth;
	        		var arrowStartY = (canvas.height*parseInt(arrowStartXY[1]))/oldheight;
	        		var arrowEndXY = aEndXY.split(",");
	        		var arrowEndX = (canvas.width*parseInt(arrowEndXY[0]))/oldwidth;
	        		var arrowEndY = (canvas.height*parseInt(arrowEndXY[1]))/oldheight;
	        	    
	        	    //第1步.画线
	        		context_show.moveTo(arrowStartX, arrowStartY);
	        		context_show.lineTo(arrowEndX, arrowEndY);
	        		context_show.fill();
	        		context_show.stroke();
	        		context_show.save();
	    			
	    			//第2步.箭头
	    	        var aArr = this._jisuan(parseInt(arrowStartX), parseInt(arrowStartY), parseInt(arrowEndX), parseInt(arrowEndY));//设定开始点。
	    	        context_show.moveTo(aArr[0], aArr[1]);
	    	        context_show.lineTo(arrowEndX, arrowEndY);
					context_show.lineTo(aArr[2], aArr[3]);
					//下面这个计算是用来在箭头与虚线的交叉点。直角三角形计算原理。。
					var lineSize = context.lineWidth;
					var newArrow1 = (lineSize == 1 || lineSize == 2) ? 10 : arrow1;
					context_show.lineTo(arrowEndX-parseInt(newArrow1*Math.cos(aArr[4]*Math.PI/180)), arrowEndY-parseInt(newArrow1*Math.sin(aArr[4]*Math.PI/180)));
					context_show.lineTo(aArr[0], aArr[1]);
					context_show.fill(); //箭头是个封闭图形  
					context_show.closePath();
					context_show.stroke();
	        	}
	        }
	        else if(ink == 6){	//文本
	        	context_show.beginPath();
	        	context_show.lineWidth = parseInt(jsonData.size);
	        	context_show.strokeStyle = jsonData.color;
	        	context_show.fillStyle = jsonData.color;

                var calculateRatio = function(newWidth, newHeight, oldWidth, oldHeight){
                    var newXRatio = newWidth / oldWidth;
                    var newYRatio = newHeight / oldHeight;
                    return {
                        newXRatio:newXRatio,
                        newYRatio:newYRatio,
                        oldXRatio:1/newXRatio,
                        oldYRatio:1/newYRatio
                    }
                };

                context_show.font="normal " + ((parseInt(jsonData.size) * 6)<10 ? 10 : (parseInt(jsonData.size) * 6)) + "px arial";
                var txy = allxy[1].split(",");
                var ratio = calculateRatio(canvas.width, canvas.height, oldwidth, oldheight);
                context_show.scale(ratio.newXRatio, ratio.newYRatio);
//				context_show.fillText(allxy[2],(canvas.width*txy[0])/oldwidth,(canvas.height*txy[1])/oldheight);
                context_show.fillText(allxy[2],txy[0],txy[1]);
                context_show.scale(ratio.oldXRatio, ratio.oldYRatio);
                /*var rx = 0.5*//*(canvas.width*txy[0])/oldwidth*//*;
                 var ry = 0.5*//*(canvas.height*txy[1])/oldheight*//*;
                 context_show.scale(rx,ry);*/

            }
	        else{
	        	// draw the point
	        	context_show.beginPath();
	        	context_show.lineWidth = parseInt(jsonData.size);
	        	context_show.strokeStyle = jsonData.color;
	        	context_show.fillStyle = jsonData.color;
	        	
		        for (i = 1; i < allxy.length; i++) {
		            var hxy = allxy[i];
		            if (hxy != "") {
//		                this._drawPoint(arrwh,hxy);
		                var drawwidth = parseInt(arrwh[0]);
		        		var drawheight = parseInt(arrwh[1]);
		        	    var drawxy = hxy.split(",");
		        	    var drawx = parseInt(drawxy[0]);
		        	    var drawy = parseInt(drawxy[1]);
		        	    var dx=(canvas_show.width*drawx)/drawwidth;
		        	    var dy=(canvas_show.height*drawy)/drawheight;
		        	    
		        	    context_show.lineTo(dx, dy);
		        	    context_show.stroke();
		            }
		        }
	        }
    		if(this.classRoomController.userID == jsonData.userid)
    			this._clearCanvas();
	    }
	},

	_drawPoint:function(arrwh,data) {
		var drawwidth = parseInt(arrwh[0]);
		var drawheight = parseInt(arrwh[1]);
	    var drawxy = data.split(",");
	    var drawx = parseInt(drawxy[0]);
	    var drawy = parseInt(drawxy[1]);
	    var dx=(canvas.width*drawx)/drawwidth;
	    var dy=(canvas.height*drawy)/drawheight;

	    context_show.lineTo(dx, dy);
	    context_show.stroke();
	}
// =========================== end 接收画板动作 =======================
}


