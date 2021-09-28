// ==UserScript==
// @name         智龙迷城战友网jQ修复
// @namespace    http://www.mapaler.com/
// @version      1.3
// @description  解决无翻墙情况下智龙迷城战友网无法展开详情问题
// @author       Mapaler <mapaler@163.com>
// @copyright    2019+, Mapaler <mapaler@163.com>
// @icon         https://pad.skyozora.com/images/egg.ico
// @include      *://pad.skyozora.com/*
// @resource     jquery  https://libs.baidu.com/jquery/1.8.3/jquery.min.js
// @grant        GM_getResourceText
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

(function() {
	'use strict';

	const MutationObserver = unsafeWindow.MutationObserver;

	//监听head的加载，代码来源于 EhTagSyringe
	const headLoaded = new Promise(function (resolve, reject) {
		if(document.head && document.head.nodeName == "HEAD") {
			console.log("已经有head");
			resolve(document.head);
		}else{
			//监听DOM变化
			let observer = new MutationObserver(function(mutations) {
				for (const mutation of mutations) {
					//监听到HEAD 结束
					if(mutation.target.nodeName === "HEAD") {
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
		const jq = document.createElement("script");
		jq.id = "user-jQuery";
		jq.type = "text/javascript";
		jq.innerHTML = GM_getResourceText("jquery");
		head.appendChild(jq);
	});

	//大数字缩短长度
	Number.prototype.bigNumberToString = function() {
		let numTemp = this.valueOf();
		if (!numTemp) return "0";
		const grouping = Math.pow(10, 4);
		const unit = ['', '万', '亿', '兆', '京', '垓'];
		const numParts = [];
		do {
			numParts.push(numTemp % grouping);
			numTemp = Math.floor(numTemp / grouping);
		} while (numTemp > 0 && numParts.length < (unit.length - 1))
		if (numTemp > 0) {
			numParts.push(numTemp);
		}
		let numPartsStr = numParts.map((num, idx) => {
			if (num > 0) {
				return (num < 1e3 ? "零" : "") + num + unit[idx];
			} else
				return "零";
		});

		numPartsStr.reverse(); //反向
		let outStr = numPartsStr.join("");
		outStr = outStr.replace(/(^零+|零+$)/g, ''); //去除开头的零
		outStr = outStr.replace(/零{2,}/g, '零'); //去除多个连续的零
		return outStr;
	}

	const bootstrap = function(){
		//去除禁止复制内容的限制
		unsafeWindow.$('#StageInfo').bind('click cut copy paste', function(event) {
			unsafeWindow.$('#StageInfo').unbind(); //调用jQ自身的去掉绑定
		});
		const styleDom = document.body.appendChild(document.createElement("style"));
		styleDom.innerHTML = `* {
	-webkit-touch-callout: unset !important;
	-webkit-user-select: unset !important;
	-khtml-user-select: unset !important;
	-moz-user-select: unset !important;
	-ms-user-select: unset !important;
	user-select: unset !important;
}`;
		//大数字加上中文字符
		const stageDetail = document.body.querySelector("#StageInfo>table:nth-of-type(2)");
		if (stageDetail)
		{
			const centerRows = stageDetail.tBodies[0].querySelectorAll(":scope>tr[align=\"center\"]:not(:first-child)");
			let numberTds = [];
			for (let tr of centerRows)
			{
				let tds = tr.querySelectorAll(":scope>td:not([rowspan])");
				if (tds.length>5)
				{
					numberTds.push(tds[0]);
					numberTds.push(tds[5]);
				}
			}

			for (let td of numberTds)
			{
				if (/[\d,\-]/g.test(td.textContent))
				{
					const num = parseInt(td.textContent.replace(/,/g,""));
					td.textContent = num.bigNumberToString();
				}
			}
		}
	}

	//加载document后执行启动器
	if (/loaded|complete/.test(document.readyState)){
		bootstrap();
	}else{
		document.addEventListener('DOMContentLoaded',bootstrap,false);
	}
})();