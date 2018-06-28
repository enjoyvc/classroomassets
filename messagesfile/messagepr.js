var editor;

KindEditor.ready(function(K) {
	editor = K.create('textarea[name="messageprtalk"]', {
		minHeight : 65,
		minWidth : 267,
		resizeType : 1,
		cssData : 'body {background: #d2d2d2}',
		allowPreviewEmoticons : false, 
		allowImageUpload : false,
		items : []
	});

	var emotions;
	K('#emotions').bind('click', function(e) {
		CreateEmotionsPanel("messageprtalk", "emotionsContent");
	});
	K("#emotionsContent").hide();
	K(document).click(function() {
		if (emotions) {
			emotions.remove();
			emotions = null;
		}
	});

});

function _getBasePath() {
	var els = document.getElementsByTagName('script'), src;
	for (var i = 0, len = els.length; i < len; i++) {
		src = els[i].src || '';
		if (/kindeditor[\w\-\.]*\.js/.test(src)) {
			return src.substring(0, src.lastIndexOf('/') + 1);
		}
	}
	return '';
}
function CreateEmotionsPanel(divEmotion,emotionsPanel)
        {
//            document.getElementById(emotionsPanel).style.display = "block";
		    if($("#"+emotionsPanel).is(':visible')){
				$("#"+emotionsPanel).hide()
			}else{
			    $("#"+emotionsPanel).show()
			}
            document.getElementById(emotionsPanel).innerHTML = "";
            var K = KindEditor;
            var self = this, name = 'emoticons',
		                path = (_getBasePath() +'/plugins/emoticons/images/'),
		                allowPreview = self.allowPreviewEmoticons === undefined ? true : self.allowPreviewEmoticons,
		                currentPageNum = 1;

            var rows = 5, cols = 9, total = 135, startNum = 0,
			            cells = rows * cols, pages = Math.ceil(total / cells),
			            colsHalf = Math.floor(cols / 2),
			            elements = [];

            var wrapperDiv = K("#"+emotionsPanel);
            var previewDiv, previewImg;
            if (allowPreview) {
                previewDiv = K('<div class="ke-preview"></div>').css('right', 0);
                previewImg = K('<img class="ke-preview-img" src="' + path + startNum + '.gif" />');
                wrapperDiv.append(previewDiv);
                previewDiv.append(previewImg);
            }
            function bindCellEvent(cell, j, num) {
                if (previewDiv) {
                    cell.mouseover(function () {
                        if (j > colsHalf) {
                            previewDiv.css('left', 0);
                            previewDiv.css('right', '');
                        } else {
                            previewDiv.css('left', '');
                            previewDiv.css('right', 0);
                        }
                        previewImg.attr('src', path + num + '.gif');
                        K(this).addClass('ke-on');
                    });
                } else {
                    cell.mouseover(function () {
                        K(this).addClass('ke-on');
                    });
                }
                cell.mouseout(function () {
                    K(this).removeClass('ke-on');
                });
                cell.click(function (e) {
                	editor.sync();
                	editor.insertHtml('<img src="' + path + num + '.gif" border="0" alt="" />');
                    document.getElementById(emotionsPanel).style.display = "none";
                    e.stop();
                });
            }
            function createEmoticonsTable(pageNum, parentDiv) {
                var table = document.createElement('table');
                parentDiv.append(table);
                if (previewDiv) {
                    K(table).mouseover(function () {
                        previewDiv.show('block');
                    });
                    K(table).mouseout(function () {
                        previewDiv.hide();
                    });
                    elements.push(K(table));
                }
                table.className = 'ke-table';
                table.cellPadding = 0;
                table.cellSpacing = 0;
                table.border = 0;
                var num = (pageNum - 1) * cells + startNum;
                for (var i = 0; i < rows; i++) {
                    var row = table.insertRow(i);
                    for (var j = 0; j < cols; j++) {
                        var cell = K(row.insertCell(j));
                        cell.addClass('ke-cell');
                        bindCellEvent(cell, j, num);
                        var span = K('<span class="ke-img"></span>')
						.css('background-position', '-' + (24 * num) + 'px 0px')
						.css('background-image', 'url(' + path + 'static.gif)');
                        cell.append(span);
                        elements.push(cell);
                        num++;
                    }
                }
                return table;
            }
            var table = createEmoticonsTable(currentPageNum, wrapperDiv);
            function removeEvent() {
                K.each(elements, function () {
                    this.unbind();
                });
            }
            var pageDiv;
            function bindPageEvent(el, pageNum) {
                el.click(function (e) {
                    removeEvent();
                    table.parentNode.removeChild(table);
                    pageDiv.remove();
                    table = createEmoticonsTable(pageNum, wrapperDiv);
                    createPageTable(pageNum);
                    currentPageNum = pageNum;
                    e.stop();
                });
            }
            function createPageTable(currentPageNum) {
                pageDiv = K('<div class="ke-page"></div>');
                wrapperDiv.append(pageDiv);
                for (var pageNum = 1; pageNum <= pages; pageNum++) {
                    if (currentPageNum !== pageNum) {
                        var a = K('<a href="javascript:;">[' + pageNum + ']</a>');
                        bindPageEvent(a, pageNum);
                        pageDiv.append(a);
                        elements.push(a);
                    } else {
                        pageDiv.append(K('@[' + pageNum + ']'));
                    }
                    pageDiv.append(K('@&nbsp;'));
                }
            }
            createPageTable(currentPageNum);
}