var WhiteBoardManagerModule = WhiteBoardManagerModule || {};

var canvas,context,canvas_show,context_show;
var canvas_top,canvas_top_context,canvas_back,canvas_back_context;
var canvas_color,canvas_color_context,current_color_context;

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

var pixels = new Array();	// just for the 'Point' tools. 
				// the array to keep the point tools split the positions with the same length to avoid the position data to large

function WhiteBoardManager(classRoomController){
	this.classRoomController = classRoomController;
    WhiteBoardManagerModule.instance = this;

    this.currentPage  = 1;      //当前页码,默认1
    this.oldPage = 1;           //前一个显示页码,默认1
    this.totalPage = 1;         //总页数,默认1

    this.isOpenWhiteboard = false;         //是否开启白板,显示主画面白板，默认为false
    this.isOpenTools = false;              //是否开启白板工具条,默认为false
    this.isOpenShareWhiteboard = false;     //是否开启共享白板,默认为false
    this.showColorBoard = false;            //是否显示调色板,默认false
    this.showLineType = false;              //是否显示线条选择窗口,默认false
    this.currentLineValue = 1;              //当前线条像素大小,默认1
    this.showTextWindow = false;            //是否显示文本输入窗口,默认false
    this.currentToolType = 0;               //当前选中的工具类型,0:画笔 1:橡皮擦 2:圆形 3:方形 4:直线 5:箭头 6:文本 7:线条 8:调色板


}

WhiteBoardManager.prototype = {
    constructor : WhiteBoardManager,
	init:function(){
        this.classroomInfoManager = WhiteBoardManagerModule.instance.classRoomController.getClassroomInfoManager();//房间信息对象
        this.userManager = WhiteBoardManagerModule.instance.classRoomController.getUserManager();        //用户对象
		
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

		// TODO::初始化
		this._initColor();              //初始化颜色面板
//		this._initPage();               //初始化白板页数
		this._bindEvent();              //绑定事件
	},
    getCurrentPage : function(){//获取白板当前页码
        return this.currentPage;
    },
    getTotalPage : function(){//获取白板总页数
        return this.totalPage;
    },
    getIsOpenWhiteboard : function(){//获取白板是否打开状态
        return this.isOpenWhiteboard;
    },
    getIsOpenTools : function(){//获取白板工具条是否打开状态
        return this.isOpenTools;
    },
    getIsOpenShareWhiteboard : function(){//获取白板共享是否打开状态
        return this.isOpenShareWhiteboard;
    },
    getShowColorBoard : function(){//获取调色板显示状态
        return this.showColorBoard;
    },
    getShowLineType : function(){//获取线条选择窗口显示状态
        return this.showLineType;
    },
    getCurrentLineValue : function(){//获取当前线条大小
        return this.currentLineValue;
    },
    getShowTextWindow : function(){//获取文本输入窗口显示状态
        return this.showTextWindow;
    },
    getCurrentToolType : function(){//获取当前工具类型
        return this.currentToolType;
    },
    colorBoardOpenAndClose : function(){//调色板打开或关闭
        this.showLineType = false;//关闭线条选择窗口
        this.showTextWindow = false;//关闭文本输入窗口
        if(this.getShowColorBoard()){
            this.showColorBoard = false;//关闭调色板窗口
            this.currentToolType = 0;
        }else{
            this.showColorBoard = true;
            this.currentToolType = 8;
        }
    },
    lineTypeOpenAndClose : function(){//线条板开启或关闭
        this.showColorBoard = false;//关闭调色板
        if(this.getShowLineType()) {//关闭线条板
            this.showLineType = false;
            this.currentToolType = 0;
        }else {
            this.showLineType = true;
            this.currentToolType = 7;
        }
    },
    currentToolTypeIsEqualByType : function(type){//根据type判断是否为当前选中的工具
        return this.currentToolType == type;
    },
    textWindowClose : function(){//关闭文本输入窗口
        this.showTextWindow = false;
        this.currentToolType == 0;
        this.setToolType(0);
    },
    setToolType:function(value){
        toolType = value;
    },
    textWindowOpenAndClose:function(){//文本输入窗口打开或关闭
        WhiteBoardManagerModule.instance.showLineType = false;
        WhiteBoardManagerModule.instance.showColorBoard = false;
        if(WhiteBoardManagerModule.instance.getShowTextWindow()){
            WhiteBoardManagerModule.instance.textWindowClose();
        }else{
            WhiteBoardManagerModule.instance.showTextWindow = true;
        }
    },
    isShowFirstAndPreviousPage : function(){//是否显示第一页和上一页操作
        return this.currentPage > 1;
    },
    isShowLastAndNextPage : function(){//是否显示最后一页和下一页操作
        return this.currentPage != this.totalPage && this.totalPage > 1;
    },
	onReceive:function(classRoom){
		// TODO::接受服务器端的回调
		$("#drawing-canvus").trigger("drawoperate", classRoom);
	},
	_bindEvent:function(){
		// TODO::绑定事件
		this._bindColorEvent();         //绑定颜色
		this._bindCanvasEvent("#drawing-canvus");
	},
	_sendPixelMessage:function(cmd, typeid, bginfo, data, isshow, memberid){
		if(cmd == "done" && (data == "" || data == null || data.length <= 1)) return;
		// send the datas drawn while the mouse left buttons up to down.
		var jsonData = this._getJsonMessage(cmd, typeid, bginfo, data, isshow, memberid);
		this.classRoomController.sendMessage(jsonData);
	},
	_getJsonMessage:function(command, typeid, imageinfo, coordinates, isshow, memberid) {
		//command操作类别名    typeid   imageinfo当前图片     coordinates座标
		var jsonMessage = {roomid:WhiteBoardManagerModule.instance.classroomInfoManager.getRoomId(),
							cmd:"whiteboard:" + command,
							userid:WhiteBoardManagerModule.instance.userManager.getUserid(),
							memberid:memberid,
							typeid:parseInt(typeid),
							pageno:WhiteBoardManagerModule.instance.currentPage,
							oldpage:WhiteBoardManagerModule.instance.oldPage,
							bginfo:imageinfo,
							color:this._getCurrentColor(),
							size:parseInt(this._getLineWidth()),
							coordinate:coordinates,
							widthheight:canvas.width+","+canvas.height,
							show:isshow,
                            userName:WhiteBoardManagerModule.instance.userManager.getUsername(),
                            classroomName:WhiteBoardManagerModule.instance.classroomInfoManager.getClassroomName()
						   };
	    return jsonMessage;
	},
	// typeid:
	// 0 - restore the screne, 
	// 1 - pagination
	_sendPageMessage:function(cmd, typeid){
		if(cmd != "getpage") return;
		var jsonData = this._getPageJsonMessage(cmd, typeid);
		this.classRoomController.sendMessage(jsonData);
	},
	_getPageJsonMessage:function(command, typeid) {
		//command操作类别名    typeid   imageinfo当前图片     coordinates座标
		var jsonMessage = {roomid:WhiteBoardManagerModule.instance.classroomInfoManager.getRoomId(),
							cmd:"whiteboard:" + command,
							userid:WhiteBoardManagerModule.instance.userManager.getUserid(),
							pageno:WhiteBoardManagerModule.instance.currentPage,
							typeid:typeid,
                            userName:WhiteBoardManagerModule.instance.userManager.getUsername(),
                            classroomName:WhiteBoardManagerModule.instance.classroomInfoManager.getClassroomName()
						   };
	    return jsonMessage;
	},
	
// ==================== start 辅助私有方法 ===================
	_getLineWidth:function(){
		//取粗细
		var lineValue = WhiteBoardManagerModule.instance.getCurrentLineValue();
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
		if(imageArray == undefined || imageArray.length <= 0){ console.log("图片数组为空"); return "";}
		return imageArray[page].replace(/\\/g, "/");
	},
// ==================== end 辅助私有方法 ===================
	
	whiteboardOn:function(){//TODO::开启白板
        WhiteBoardManagerModule.instance.isOpenWhiteboard = true;
	},
	whiteboardOff:function(){//TODO::关闭白板
        WhiteBoardManagerModule.instance.isOpenWhiteboard = false;
	},
	whiteboardToolsOn:function(){//TODO::工具条开启
        WhiteBoardManagerModule.instance.isOpenTools = true;
	},
	whiteboardToolsOff:function(){//TODO::工具条关闭
        WhiteBoardManagerModule.instance.isOpenTools = false;
	},
    setShareWhiteboard:function(status){//TODO::设置共享白板状态
        WhiteBoardManagerModule.instance.isOpenShareWhiteboard = status;
    },
// ==================== start 初始化选择颜色canvas ===================
	_showWhiteboard:function(isshow){
		if(isshow){
			$("#v-box-cont").css("background-color","#ffffff");
            if(!(!WhiteBoardManagerModule.instance.userManager.isTeacher() && WhiteBoardManagerModule.instance.classroomInfoManager.getTeacherShareVideo())){
                WhiteBoardManagerModule.instance.whiteboardOn();//开启白板,隐藏视频
            }
            if(WhiteBoardManagerModule.instance.userManager.isTeacher()) {
                WhiteBoardManagerModule.instance.whiteboardToolsOn();
            }else{
                if(WhiteBoardManagerModule.instance.getIsOpenShareWhiteboard()){
                    WhiteBoardManagerModule.instance.whiteboardToolsOn();
                }else{
                    WhiteBoardManagerModule.instance.whiteboardToolsOff();
                }
            }
		}
		else{
			$("#v-box-cont").css("background-color","#000000");
			WhiteBoardManagerModule.instance.whiteboardOff();//关闭白板,显示视频
			WhiteBoardManagerModule.instance.whiteboardToolsOff();
		}
        WhiteBoardManagerModule.instance.setTeaWhiteboardStatus(isshow);
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
	initWhiteboardPage:function(currentPage,totalPage){//TODO::初始化页数
        WhiteBoardManagerModule.instance.currentPage = currentPage;
        WhiteBoardManagerModule.instance.totalPage = totalPage;
	},
	_initPage:function(){
		var parent = this;		
		$.ajax({
	        url: VC.ROUTER.LIVE.ROOMDETAIL,
	        type: "get",
	        async: false,
	        data: "roomid="+WhiteBoardManagerModule.instance.classroomInfoManager.getRoomId()+"&t="+new Date().getTime(),
	        dataType: "json",
	        success: function (data) {
	        	WhiteBoardManagerModule.instance.totalPage = data.imgs.length;
	        	WhiteBoardManagerModule.instance.initWhiteboardPage(WhiteBoardManagerModule.instance.currentPage, WhiteBoardManagerModule.instance.totalPage);
	        	if(WhiteBoardManagerModule.instance.totalPage>0){
		        	for(var i=1; i<=WhiteBoardManagerModule.instance.totalPage; i++){
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
	selectTool:function(type){//TODO::选择工具
        WhiteBoardManagerModule.instance.currentToolType = type;
	},
	selectCircle: function () {
        toolType = 2;	//圆
        WhiteBoardManagerModule.instance.selectTool(toolType);
        context.strokeStyle = WhiteBoardManagerModule.instance._getCurrentColor();
        context.fillStyle = WhiteBoardManagerModule.instance._getCurrentColor();
        context.lineWidth = WhiteBoardManagerModule.instance._getLineWidth();
    },
    selectParty: function () {
        toolType = 3;	//方形
        WhiteBoardManagerModule.instance.selectTool(toolType);
        context.strokeStyle = WhiteBoardManagerModule.instance._getCurrentColor();
        context.fillStyle = WhiteBoardManagerModule.instance._getCurrentColor();
        context.lineWidth = WhiteBoardManagerModule.instance._getLineWidth();
    },
    selectStraightline: function () {
        toolType = 4;	//直线
        WhiteBoardManagerModule.instance.selectTool(toolType);
        context.strokeStyle = WhiteBoardManagerModule.instance._getCurrentColor();
        context.fillStyle = WhiteBoardManagerModule.instance._getCurrentColor();
        context.lineWidth = WhiteBoardManagerModule.instance._getLineWidth();
    },
    selectPen: function () {
        toolType = 0;	//画笔
        WhiteBoardManagerModule.instance.selectTool(toolType);
        context.strokeStyle = WhiteBoardManagerModule.instance._getCurrentColor();
        context.fillStyle = WhiteBoardManagerModule.instance._getCurrentColor();
        context.lineWidth = WhiteBoardManagerModule.instance._getLineWidth();
    },
    selectEraser: function () {
        toolType = 1;	//橡皮檫
        WhiteBoardManagerModule.instance.selectTool(toolType);
        context.lineWidth = WhiteBoardManagerModule.instance._getLineWidth();
    },
    selectCleanWhiteBoard: function () {//清除
        var msg = VC.ROUTER.LIVEBIG.LIVE_CLEAN_WHITEBOARD_TIPS;
        var modalInstance = WhiteBoardManagerModule.instance.classroomInfoManager.operationMessageWindow(msg);
        modalInstance.result.then(function (result) {
            if (result) {
                WhiteBoardManagerModule.instance.cleanWhiteboard();
            }
        });
        /*WhiteBoardManagerModule.instance.selectTool('clean');
         parent._clearCanvas();
         parent._clearCanvasShow();
         parent._sendPixelMessage("done", 7, "", "7#0,0", true, 0);*/
    },
    selectTextInput: function () {
        WhiteBoardManagerModule.instance.textWindowOpenAndClose();
        if (WhiteBoardManagerModule.instance.getShowTextWindow())
            toolType = 6;	//文本
        else
            toolType = 0;
        WhiteBoardManagerModule.instance.selectTool(toolType);
        context.strokeStyle = WhiteBoardManagerModule.instance._getCurrentColor();
        context.fillStyle = WhiteBoardManagerModule.instance._getCurrentColor();
        context.lineWidth = WhiteBoardManagerModule.instance._getLineWidth();
    },
    selectLine: function (value) {//选择线条
        WhiteBoardManagerModule.instance.currentLineValue = value;
        var widthVal = WhiteBoardManagerModule.instance._getValidAdjust(value);
        context.lineWidth = widthVal;
        WhiteBoardManagerModule.instance.lineOff();
    },
    cleanWhiteboard:function(){     //清屏
        WhiteBoardManagerModule.instance._clearCanvas();
        WhiteBoardManagerModule.instance._clearCanvasShow();
        WhiteBoardManagerModule.instance._sendPixelMessage("done", 7, "", "7#0,0", true, 0);
    },
	colorOff:function(){//TODO::关闭调色板
        WhiteBoardManagerModule.instance.showColorBoard = false;
	},
	lineOff:function(){//关闭线条选择窗口
        WhiteBoardManagerModule.instance.showLineType = false;
        WhiteBoardManagerModule.instance.currentToolType = 0;
	},
	//绑定画板事件
	_bindCanvasEvent:function(drawingCanvas){
		var parent = this;
        /** 触屏,手指点击 */
        $(drawingCanvas)[0].addEventListener('touchstart',function(event){
            context.beginPath();
            WhiteBoardManagerModule.instance.colorOff();
            WhiteBoardManagerModule.instance.lineOff();
            var toolsIsOn =  WhiteBoardManagerModule.instance.getIsOpenTools();
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
                if(!WhiteBoardManagerModule.instance.getShowTextWindow()){
                    return;
                }
                textValue = $("#txtText").val();
                if(textValue=="" || textValue == null){
                    var msg = VC.ROUTER.LIVEBIG.WHITEBOARDMANAGER_INPUT_TEXT;
                    WhiteBoardManagerModule.instance.classroomInfoManager.showMessageWindow(msg);
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

                var toolsIsOn =  WhiteBoardManagerModule.instance.getIsOpenTools();
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
            var toolsIsOn =  WhiteBoardManagerModule.instance.getIsOpenTools();
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
			var toolsIsOn =  WhiteBoardManagerModule.instance.getIsOpenTools();
			if(!toolsIsOn) return;
			var mousePos = parent._getMousePos(e);
			var downStartX =  mousePos.x;
			var downStartY = mousePos.y;
			startX = mousePos.x;
			startY = mousePos.y;
			

			context.lineWidth = parent._getLineWidth();
			context.strokeStyle = parent._getCurrentColor();
			context.fillStyle = parent._getCurrentColor();
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
                if(!WhiteBoardManagerModule.instance.getShowTextWindow()){
                    return;
                }
				textValue = $("#txtText").val();
				if(textValue=="" || textValue == null){
					//alert("请先输入文本内容");
                    var msg = VC.ROUTER.LIVEBIG.WHITEBOARDMANAGER_INPUT_TEXT;
                    WhiteBoardManagerModule.instance.classroomInfoManager.showMessageWindow(msg);
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
			var toolsIsOn =  WhiteBoardManagerModule.instance.getIsOpenTools();
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
			var toolsIsOn =  WhiteBoardManagerModule.instance.getIsOpenTools();
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
			var toolsIsOn =  WhiteBoardManagerModule.instance.getIsOpenTools();
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
                context_show.drawImage(imgs,0,0,canvas_show.width,canvas_show.height);
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
				shareWhiteboard = jsonData.controlpanel.sharewhiteboard;		//是否共享白板操作(工具条)
				if(WhiteBoardManagerModule.instance.userManager.isOneselfByUserid(jsonData.userid)){		//判断是否自己
					parent._showWhiteboard(jsonData.show);
					if(jsonData.show)
						parent.setShareWhiteboard(jsonData.controlpanel.sharewhiteboard==1);
					
			    		WhiteBoardManagerModule.instance.currentPage = jsonData.pageno;
				    	var imgSrc = parent._getImageSrc(WhiteBoardManagerModule.instance.currentPage);
					if(imgSrc != "")
				    		parent._loadBackCanvasImgae(imgSrc);

                    if(!jsonData.isteacher && jsonData.classroom.quota > 10 && jsonData.classroom.ispublic && jsonData.isauth == 0){
                        WhiteBoardManagerModule.instance.whiteboardToolsOff();
                    }
                    WhiteBoardManagerModule.instance.initWhiteboardPage(WhiteBoardManagerModule.instance.currentPage, WhiteBoardManagerModule.instance.totalPage);
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
                WhiteBoardManagerModule.instance.currentPage = jsonData.pageno;
				var backimgsrc = parent._getImageSrc(WhiteBoardManagerModule.instance.currentPage);
				if(backimgsrc != "")
					parent._loadBackCanvasImgae(backimgsrc);
		    	
		    	if(jsonData.bginfo != null && jsonData.bginfo != "" && jsonData.bginfo != undefined){
			    	parent._preImage(jsonData.bginfo,function(imgs){
			    		context.drawImage(imgs,0,0,canvas.width,canvas.height);
			        });
		    	}
			}
			else if(jsonData.cmd == "whiteboard:getpage"){
                if(!WhiteBoardManagerModule.instance.userManager.isOneselfByUserid(jsonData.userid) && jsonData.typeid == 0){    //排除别人且非翻页
                    return;
                }
				parent._clearCanvas();	//先清理画板再画 
				parent._clearCanvasShow();
                WhiteBoardManagerModule.instance.currentPage = jsonData.pageno;
				var backimgsrc = parent._getImageSrc(WhiteBoardManagerModule.instance.currentPage);
				if(backimgsrc != "")
					parent._loadBackCanvasImgae(backimgsrc);//加载背景图
				if(jsonData.datas == "" || jsonData.datas == null || jsonData.datas.length<=0) return;
                for(var i=0; i<jsonData.datas.length; i++){
                    parent._drawPoints(jsonData.datas[i], true);
                }
			}
			else if(jsonData.cmd == "whiteboard:init"){	// !!! useless path, it should be remove in the coming on.
				//收到新登录用户的初始化白板请求后老师当前页面生成所需信息
                if(WhiteBoardManagerModule.instance.userManager.isOneselfByUserid(jsonData.memberid)){
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
                if(WhiteBoardManagerModule.instance.userManager.isOneselfByUserid(jsonData.memberid)){
					parent._showWhiteboard(jsonData.show);
					if(jsonData.show)
						parent.setShareWhiteboard(jsonData.typeid==1);
				    	if(jsonData.bginfo != null && jsonData.bginfo != "" && jsonData.bginfo != undefined){
					    	parent._preImage(jsonData.bginfo,function(imgs){
					    		context.drawImage(imgs,0,0,canvas.width,canvas.height);
					        	});
				    	}
		    		}
			}
			else if(jsonData.cmd == "controlpanel:sharewhiteboard"){
				shareWhiteboard = jsonData.status
			}
			else if(jsonData.cmd == "userctrl:stopwhiteboard"){
				if(WhiteBoardManagerModule.instance.userManager.isOneselfByUserid(jsonData.userid) && !WhiteBoardManagerModule.instance.userManager.isTeacher()){
					if(jsonData.status == 1){
						if(!WhiteBoardManagerModule.instance.classroomInfoManager.isTeachingMode()){//讨论模式
							WhiteBoardManagerModule.instance.whiteboardToolsOn();
							WhiteBoardManagerModule.instance.whiteboardShareOn();
						}else{
							WhiteBoardManagerModule.instance.whiteboardToolsOff();
							WhiteBoardManagerModule.instance.whiteboardShareOff();
						}
					}else{
						WhiteBoardManagerModule.instance.whiteboardToolsOff();
						WhiteBoardManagerModule.instance.whiteboardShareOff();
					}
		    	}
                WhiteBoardManagerModule.instance.classroomInfoManager.updateUserStopwhiteboardValueFromMembersByUseridAndValue(jsonData.userid,jsonData.status);
			}
			else if(jsonData.cmd == "robot:imgsupdate"){
                WhiteBoardManagerModule.instance.coursewareTransformation(jsonData);
                WhiteBoardManagerModule.instance.currentPage = 1;
				parent._clearCanvas();
				parent._clearCanvasShow();
				parent._initPage();
				parent._sendPixelMessage("cleanimgs", 0, "", "", true, 0);
			}
			
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
		arr[4] = angle;
		return arr;
	},

	firstPage : function(){//首页
		if(this.totalPage==0){
            var msg = VC.ROUTER.LIVEBIG.WHITEBOARDMANAGER_FIRST_PAGE;
            WhiteBoardManagerModule.instance.classroomInfoManager.showMessageWindow(msg);
			return;
		}
		this.oldPage = this.currentPage;
        this.currentPage = 1;

		var firstSrc = this._getImageSrc(this.currentPage);
		if(firstSrc != "")
			this._loadBackCanvasImgae(firstSrc);
		this.initWhiteboardPage(this.currentPage, this.totalPage);

		this._sendPageMessage("getpage", 1);
	},
	lastPage : function(){//尾页
		if(this.totalPage==0){
            var msg = VC.ROUTER.LIVEBIG.WHITEBOARDMANAGER_LAST_PAGE;
            WhiteBoardManagerModule.instance.classroomInfoManager.showMessageWindow(msg);
			return;
		}
		this.oldPage = this.currentPage;
		this.currentPage = parseInt(this.totalPage);
		var drawCanvas = $("#drawing-canvus");
	    var image = drawCanvas[0].toDataURL("image/png");
		var lastSrc = this._getImageSrc(this.currentPage);
		if(lastSrc != "")
			this._loadBackCanvasImgae(lastSrc);
		this.initWhiteboardPage(this.currentPage,this.totalPage);

		this._sendPageMessage("getpage", 1);
	},
	previousPage : function(){
		if(this.currentPage == 1){
            var msg = VC.ROUTER.LIVEBIG.WHITEBOARDMANAGER_FIRST_PAGE;
            WhiteBoardManagerModule.instance.classroomInfoManager.showMessageWindow(msg);
			return;
		}
		var drawCanvas = $("#drawing-canvus");
	    var image = drawCanvas[0].toDataURL("image/png");
        this.currentPage = this.currentPage - 1;
		var prevSrc = this._getImageSrc(this.currentPage);
		if(prevSrc != "")
			this._loadBackCanvasImgae(prevSrc);
		this.initWhiteboardPage(this.currentPage, this.totalPage);

		this._sendPageMessage("getpage", 1);
	},
	nextPage : function(){
		if(this.currentPage == this.totalPage || this.totalPage == 0){
            var msg = VC.ROUTER.LIVEBIG.WHITEBOARDMANAGER_LAST_PAGE;
            WhiteBoardManagerModule.instance.classroomInfoManager.showMessageWindow(msg);
			return;
		}
		var drawCanvas = $("#drawing-canvus");
	    var image = drawCanvas[0].toDataURL("image/png");
	    this.currentPage = this.currentPage + 1;
		var nextSrc = this._getImageSrc(this.currentPage);
		if(nextSrc != "")
			this._loadBackCanvasImgae(nextSrc);
		this.initWhiteboardPage(this.currentPage, this.totalPage);

		this._sendPageMessage("getpage", 1);
	},
	whiteboardShareOn:function(){//TODO::白板共享开启
        WhiteBoardManagerModule.instance.isOpenShareWhiteboard = true;
	},
	whiteboardShareOff:function(){//TODO::白板共享关闭
        WhiteBoardManagerModule.instance.isOpenShareWhiteboard = false;
	},
    setTeaWhiteboardStatus:function(status){//TODO::设置老师是否开启白板状态
        WhiteBoardManagerModule.instance.classroomInfoManager.teacherWhiteboardStatus = status;
    },
    openOrCloseWhiteboard:function(){       //打开或关闭白板
        var parent = this;
        if(!WhiteBoardManagerModule.instance.userManager.isTeacher())
            return;
        var show = false;
        if(WhiteBoardManagerModule.instance.userManager.isTeacher()){
            if(WhiteBoardManagerModule.instance.getIsOpenWhiteboard()){	// act to hiden then canvas of the WB
                WhiteBoardManagerModule.instance.whiteboardOff();		//关闭白板,显示视频
                WhiteBoardManagerModule.instance.whiteboardToolsOff();	//关闭工具条
                WhiteBoardManagerModule.instance.whiteboardShareOff();
                show = false;
            }
            else{
                WhiteBoardManagerModule.instance.whiteboardOn();		//开启白板,关闭视频
                WhiteBoardManagerModule.instance.whiteboardToolsOn();	//开启工具条
                show = true;
            }
            WhiteBoardManagerModule.instance.setTeaWhiteboardStatus(show);
            //TODO:发送显示隐藏白板命令
            WhiteBoardManagerModule.instance._sendPixelMessage("done", 8, "", "8#1,1", show, 0);	// 8#1,1 - useless, just for the judgement of the length to avoid send message incorrectly.
            return true;
        }
        else
            return false;
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
	    	        context_show.lineTo(arrowEndX, arrowEndY)
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
    		if(WhiteBoardManagerModule.instance.userManager.isOneselfByUserid(jsonData.userid))
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


