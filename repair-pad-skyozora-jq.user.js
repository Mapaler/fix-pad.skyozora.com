// ==UserScript==
// @name         智龙迷城战友网jQ修复
// @namespace    http://www.mapaler.com/
// @version      1.1
// @description  解决无翻墙情况下智龙迷城战友网无法展开详情问题
// @author       Mapaler <mapaler@163.com>
// @copyright    2019+, Mapaler <mapaler@163.com>
// @icon         https://pad.skyozora.com/images/egg.ico
// @include      *://pad.skyozora.com/*
// @resource     jquery  http://libs.baidu.com/jquery/1.8.3/jquery.min.js
// @grant        GM_getResourceText
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

(function() {
	'use strict';

	//监听head的加载，代码来源于 EhTagSyringe
	const headLoaded = new Promise(function (resolve, reject) {
		if(unsafeWindow.document.head && unsafeWindow.document.head.nodeName == "HEAD"){
			resolve(unsafeWindow.document.head);
		}else{
			//监听DOM变化
			MutationObserver = window.MutationObserver;
			let observer = new MutationObserver(function(mutations) {
				for(let i in mutations){
					let mutation = mutations[i];
					//监听到HEAD 结束
					if(mutation.target.nodeName == "HEAD"){
						observer.disconnect();
						resolve(mutation.target);
						break;
					}
				}
			});
			observer.observe(document, {childList: true, subtree: true, attributes: true});
		}
	});

	//head加载后添加国内的JQ源
	headLoaded.then(function (head) {
		let jq = document.createElement("script");
		jq.id = "user-jQuery";
		jq.type = "text/javascript";
		jq.innerHTML = GM_getResourceText("jquery");
		head.appendChild(jq);
	})

	//启动器
	var bootstrap = function(){
		unsafeWindow.$('#StageInfo').bind('click cut copy paste', function(event) {
			unsafeWindow.$('#StageInfo').unbind(); //调用jQ自身的去掉绑定
		});
		let styleDom = document.body.appendChild(document.createElement("style"));
		styleDom.innerHTML = `* {
	-webkit-touch-callout: unset !important;
	-webkit-user-select: unset !important;
	-khtml-user-select: unset !important;
	-moz-user-select: unset !important;
	-ms-user-select: unset !important;
	user-select: unset !important;
}`;
	}

	//加载document后执行启动器
	if (/loaded|complete/.test(document.readyState)){
		bootstrap();
	}else{
		document.addEventListener('DOMContentLoaded',bootstrap,false);
	}
})();