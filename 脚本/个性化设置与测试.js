"ui";

ui.layout(
    <frame>
        <vertical align="top" margin="30 50">
            <text w="*" h="auto" text="个性化信息初始化" size="30sp" gravity="center" />
            <text w="*" h="auto" text="点击左侧按钮进行保存" size="20sp" gravity="center" margin="0 10" />
            <linear>
                <vertical>
                    <button id="wecom_secret" text="小程序密钥" h="40" margin="5 5" />
                    <button id="wecom_aid" text="小程序ID" h="40" margin="5 5" />
                    <button id="wecom_cid" text="企业ID" h="40" margin="5 5" />
                    <button id="wecom_touid" text="微信账户ID" h="40" margin="5 5" />
                    <button id="imgurl" text="默认图床" h="40" margin="5 5" />
                    <button id="screenUnlockCode" text="锁屏密码" h="40" margin="5 5" />
                    <button id="AlipayPaymentCode" text="支付密码" h="40" margin="5 5" />
                    <button id="serverChanSendKey" text="SendKey" h="40" margin="5 5" />
                </vertical>
                <vertical w="*">
                    <input id="wecom_secret_input" h="50" size="14sp" />
                    <input id="wecom_aid_input" h="50" size="14sp" />
                    <input id="wecom_cid_input" h="50" size="14sp" />
                    <input id="wecom_touid_input" h="50" size="14sp" inputType="textNoSuggestions" />
                    <input id="imgurl_input" h="50" size="14sp" hin="图床地址，图片应小于2MB" autoLink="web" inputType="textUri" />
                    <input id="screenUnlockCode_input" h="50" size="14sp" hint="123456" inputType="numberPassword" />
                    <input id="AlipayPaymentCode_input" h="50" size="14sp" hint="123456" inputType="numberPassword" />
                    <input id="serverChanSendKey_input" h="50" size="14sp" hint="server酱的推送通道，已弃用" />
                </vertical>
            </linear>
            <vertical w="*">
                <button id="screenUnlockTest" text="解锁屏幕测试(点击后请手动关闭屏幕)" h="40" margin="5 0" />
                <button id="screenCaptureTest" text="截屏权限自动申请测试" h="40" margin="5 0" />
            </vertical>
            <linear>
                <button id="weChatPushTestButton" text="微信推送测试" h="40" margin="5 0" />
                <spinner entries="text|image|news|mpnews|markdown" id="weChatPushTestType" w="*" h="40" />
            </linear>
            <linear gravity="center">
                <button id="resetStorage" text="重置" margin="10 0" />
                <button id="closeUI" text="退出" margin="10 0" />
            </linear>
        </vertical>
    </frame>
);

threads.start(function () {
    for (let i = 0; i < 300; i++) {
        sleep(1000);
    }
    toastLog("个性化设置与测试脚本已超时，自动关闭");
    ui.finish();
});

var storage_privateinfo = storages.create("privateInformation");
var red = colors.rgb(255, 0, 0);
var green = colors.rgb(0, 255, 0);
var lightCyan = colors.rgb(215, 255, 255);
var idTable = ["wecom_secret", "wecom_aid", "wecom_cid", "wecom_touid", "imgurl", "screenUnlockCode", "AlipayPaymentCode", "serverChanSendKey"];
var uiObjectTable = [ui.wecom_secret, ui.wecom_aid, ui.wecom_cid, ui.wecom_touid, ui.imgurl, ui.screenUnlockCode, ui.AlipayPaymentCode, ui.serverChanSendKey];
var uiObject_InputTable = [
    ui.wecom_secret_input,
    ui.wecom_aid_input,
    ui.wecom_cid_input,
    ui.wecom_touid_input,
    ui.imgurl_input,
    ui.screenUnlockCode_input,
    ui.AlipayPaymentCode_input,
    ui.serverChanSendKey_input,
];
var idTableIndex = 0;
ui.statusBarColor(lightCyan);
ui.wecom_secret.parent.parent.parent.parent.setBackgroundColor(lightCyan);

ui.wecom_secret.on("click", () => {
    idTableIndex = 0;
    saveConfig();
});
ui.wecom_aid.on("click", () => {
    idTableIndex = 1;
    saveConfig();
});
ui.wecom_cid.on("click", () => {
    idTableIndex = 2;
    saveConfig();
});
ui.wecom_touid.on("click", () => {
    idTableIndex = 3;
    saveConfig();
});

ui.imgurl.on("click", () => {
    idTableIndex = 4;
    saveConfig();
});
ui.screenUnlockCode.on("click", () => {
    idTableIndex = 5;
    saveConfig();
});
ui.AlipayPaymentCode.on("click", () => {
    idTableIndex = 6;
    saveConfig();
});
ui.serverChanSendKey.on("click", () => {
    idTableIndex = 7;
    saveConfig();
});

function saveConfig() {
    storage_privateinfo.put(idTable[idTableIndex], uiObject_InputTable[idTableIndex].text());
    if (uiObject_InputTable[idTableIndex].text()) {
        toastLog(idTable[idTableIndex] + "is set to: " + storage_privateinfo.get(idTable[idTableIndex]));
        uiObjectTable[idTableIndex].setBackgroundColor(green);
    } else {
        toastLog("invaild input");
        uiObjectTable[idTableIndex].setBackgroundColor(red);
    }
}

ui.weChatPushTestButton.on("click", () => {
    threads.start(function () {
        let msgtype = ui.weChatPushTestType.getSelectedItem();
        let temp = weChatPush("content", "微信推送测试", "msgtype", msgtype);
        if (temp) {
            toastLog("微信推送成功，请前往查收确认");
        }
    });
});

ui.screenUnlockTest.on("click", () => {
    threads.start(function () {
        if (!storage_privateinfo.get("screenUnlockCode")) {
            alert("请先设置锁屏密码");
        } else {
            var deviceUnlocker = require("解锁屏幕.js");
            sleep(3000);
            if (deviceUnlocker) {
                for (let i = 0; i < 10; i++) {
                    if (device.isScreenOn()) {
                        toast("请手动关闭屏幕以便进行测试");
                        sleep(3000);
                    }
                }
                if (device.isScreenOn()) {
                    alert("由于权限不足，请手动关闭屏幕以便进行屏幕解锁测试~");
                    for (let i = 0; i < 5; i++) {
                        if (device.isScreenOn()) {
                            toast("请手动关闭屏幕以便进行测试");
                            sleep(5000);
                        }
                    }
                }
                sleep(1000);
                toastLog(deviceUnlocker.unlockDevice());
            } else {
                alert('未找到脚本"解锁屏幕.js"');
            }
        }
    });
});

ui.screenCaptureTest.on("click", () => {
    threads.start(function () {
        getScreenCaptureAuthority();
        sleep(100);
        files.create("./日志/");
        images.save(captureScreen(), "./日志/截图测试.jpg", "jpg", 50);
        sleep(2000);
        if (images.read("./日志/截图测试.jpg")) {
            toastLog("成功截图并保存于脚本根目录，请检查");
        } else {
            toastLog("截图保存失败，请检查权限或联系开发者");
        }
    });
});

ui.resetStorage.on("click", () => {
    threads.start(function () {
        if (confirm("请确认重置配置文件")) {
            storages.remove("privateInformation");
            storage_privateinfo = storages.create("privateInformation");
            toastLog("配置已重置");
        } else {
            toastLog("操作已取消");
        }
    });
});

ui.closeUI.on("click", () => {
    ui.finish();
});

ui.run(initial);
function initial() {
    ui.wecom_secret_input.setText(storage_privateinfo.get("wecom_secret") || "xG5n9UGIFZRv1nupfL6ppT3oIOTRwkEqoeuM4EBVGYU");
    ui.wecom_aid_input.setText(storage_privateinfo.get("wecom_aid") || "1000003");
    ui.wecom_cid_input.setText(storage_privateinfo.get("wecom_cid") || "wwbec536b05f7c37df");
    ui.wecom_touid_input.setText(storage_privateinfo.get("wecom_touid") || "");
    ui.imgurl_input.setText(storage_privateinfo.get("imgurl") || "https://api.dujin.org/bing/1920.php");
    ui.screenUnlockCode_input.setText(storage_privateinfo.get("screenUnlockCode") || "");
    ui.AlipayPaymentCode_input.setText(storage_privateinfo.get("AlipayPaymentCode") || "");
    ui.serverChanSendKey_input.setText(storage_privateinfo.get("serverChanSendKey") || "");
    ui.wecom_touid_input.hint = "联系开发者获取，如“gtl”";
    ui.serverChanSendKey_input.hint = "server酱的推送通道，已弃用";

    for (let index = 0; index < idTable.length; index++) {
        if (storage_privateinfo.get(idTable[index])) {
            uiObjectTable[index].setBackgroundColor(green);
        } else {
            uiObjectTable[index].setBackgroundColor(red);
        }
    }
}

//let msgid = weChatPush("wecom_secret", wecom_secret, "wecom_aid", wecom_aid, "wecom_cid", wecom_cid, "wecom_touid", wecom_touid, "content", content, "msgtype", msgtype, "imgurl", imgurl);
function weChatPush() {
    let storage_privateinfo = storages.create("privateInformation");
    let wecom_secret, wecom_aid, wecom_cid, wecom_touid, msgtype, content, title, imgurl, media_id;
    if (arguments.length == 1) {
        content = arguments[0];
    } else {
        for (let i = 0; i < arguments.length; ) {
            let elementDesc = arguments[i++];
            let element = arguments[i++];
            switch (elementDesc) {
                case "content":
                    content = element;
                    break;
                case "title":
                    title = element;
                    break;
                case "wecom_secret":
                    wecom_secret = element;
                    break;
                case "wecom_aid":
                    wecom_aid = element;
                    break;
                case "wecom_cid":
                    wecom_cid = element;
                    break;
                case "wecom_touid":
                    wecom_touid = element;
                    break;
                case "msgtype":
                    msgtype = element;
                    break;
                case "imgurl":
                    imgurl = element;
                    break;
                default:
                    console.error("invaild parament:");
                    console.trace(arguments);
            }
        }
    }

    if (!title) {
        let dateTime = new Date();
        let dateStr = dateTime.toLocaleDateString().substr(5);
        let timeStr = dateTime.toTimeString().substr(0, 5);
        if (msgtype == "markdown") {
            title = "# " + dateStr + timeStr;
        } else {
            title = dateStr + timeStr;
        }
    }
    if (!wecom_secret) {
        wecom_secret = storage_privateinfo.get("wecom_secret");
    }
    if (!wecom_aid) {
        wecom_aid = storage_privateinfo.get("wecom_aid");
    }
    if (!wecom_cid) {
        wecom_cid = storage_privateinfo.get("wecom_cid");
    }
    if (!wecom_touid) {
        wecom_touid = storage_privateinfo.get("wecom_touid");
    }
    if (!msgtype) {
        msgtype = "text";
    }
    if (!imgurl) {
        imgurl = storage_privateinfo.get("imgurl");
        if (!imgurl) {
            imgurl = "http://iw233.cn/api/Random.php";
        }
    }
    get_token_url = "https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=" + wecom_cid + "&corpsecret=" + wecom_secret;
    response = http.get(get_token_url).body.json();
    let access_token = response["access_token"];

    if (msgtype == "image" || msgtype == "mpnews" || msgtype == "news") {
        picture = http.get(imgurl).body.bytes(); //https://acg.yanwz.cn/menhera/api.php
        files.writeBytes("./wxImg_uploadTemp.jpg", picture);
        upload_url = "https://qyapi.weixin.qq.com/cgi-bin/media/upload?access_token=" + access_token + "&type=image";
        let upload_response_json = http.postMultipart(upload_url, { picture: open("./wxImg_uploadTemp.jpg") }).body.json();
        if (upload_response_json["errcode"] != 0) {
            console.error("errcode: " + upload_response_json["errcode"]);
            console.error("errmsg: " + upload_response_json["errmsg"]);
            return;
        } else {
            media_id = upload_response_json["media_id"];
        }
    }

    if (access_token.length > 0) {
        send_msg_url = "https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=" + access_token;
        data = {
            touser: wecom_touid,
            agentid: wecom_aid,
            msgtype: msgtype,
            duplicate_check_interval: 600,
            text: {
                content: title + "\r\n" + content,
            },
            markdown: {
                content: title + "\r\n" + content,
            },
            image: {
                media_id: media_id,
            },
            news: {
                articles: [
                    {
                        title: title,
                        description: content,
                        url: "www.github.com",
                        picurl: imgurl, //"https://acg.yanwz.cn/menhera/api.php",
                    },
                ],
            },
            mpnews: {
                articles: [
                    {
                        title: title,
                        thumb_media_id: media_id,
                        author: "G大师",
                        content_source_url: "www.github.com",
                        content: "广告位招租",
                        digest: content,
                    },
                ],
            },
        };
        let response_body = http.postJson(send_msg_url, data).body.json();
        if (response_body["errcode"] == 0) {
            return response_body["msgid"];
        } else {
            console.error("errmsg: " + response_body["errmsg"]);
            return;
        }
    }
}

function smartClick(widget) {
    if (widget) {
        if (widget.clickable()) {
            widget.click();
            return true;
        } else {
            let widget_temp = widget.parent();
            for (let triedTimes = 0; triedTimes < 5; triedTimes++) {
                if (widget_temp.clickable()) {
                    widget_temp.click();
                    return true;
                }
                widget_temp = widget_temp.parent();
                if (!widget_temp) {
                    break;
                }
            }

            click(widget.bounds().centerX(), widget.bounds().centerY());
            return true;
        }
    } else {
        // console.verbose('invalid widget')
        console.trace("invalid widget : ");
        return false;
    }
}

function getScreenCaptureAuthority() {
    threads.start(function () {
        let i = 0;
        for (; i < 5; i++) {
            if (smartClick(textContains("立即开始").findOne(1000)) || smartClick(textContains("允许").findOne(1000))) {
                break;
            }
        }
        if (i == 10) {
            click(device.width - 300, device.height - 200);
        }
    });
    sleep(500);
    requestScreenCapture();
}
