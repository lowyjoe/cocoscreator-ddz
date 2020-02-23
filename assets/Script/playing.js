// Learn cc.Class:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/class/index.html
// Learn Attribute:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/reference/attributes/index.html
// Learn life-cycle callbacks:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/life-cycle-callbacks/index.html
var PokerObj = require("Poker");
var pokerTypes = require('pokerTypes');
var PlayerType = cc.Enum({
    left: 0,
    right: -1,
    player: -1,
    dipai: -1,
    shoupai: -1
})
cc.Class({
    extends: cc.Component,

    properties: {
        poker: cc.Prefab, //扑克

        allPokers: [], //所有牌
        // leftPokers: [], //左边牌
        // rightPokers: [], //右边牌
        playerPokers: [], //玩家牌
        dipaiPokers: [], //底牌
        leftPokersOut: [], //左边打出牌
        rightPokersOut: [], //右边打出牌
        playerPokersOut: [], //玩家打出牌
        pokerSpriteFrameMap: {
            default: {},
            visible: false,
        },
        resultLabel: cc.Label, //结果文字

        leftReady: cc.Label, //左边准备
        rightReady: cc.Label, //右边准备
        playerReady: cc.Label, //玩家准备
        //控制的东西
        maskBackground: cc.Node, //开始前的遮罩
        startBtn: cc.Button, //开始按钮
        leftCount: cc.Label, //左边数量
        leftbuchu: cc.Label, //左边不出
        leftShowPoker: cc.Node, //左边展示Poker
        rightCount: cc.Label, //右边数量
        rightShowPoker: cc.Node, //右边展示Poker
        rightbuchu: cc.Label, //右边不出

        playerbuchu: cc.Label, //玩家不出或不抢

        playerHandCards: cc.Node, //玩家手牌
        playerOutCards: cc.Node, //玩家出牌
        playerAction: cc.Node, //玩家按钮
        playerDizhuAction: cc.Node, //玩家按钮

        dipaiShowPoker: cc.Node, //右边展示Poker

        leftTip: cc.Node, //左边手牌了
        rightTip: cc.Node, //右边出牌了
        playerTip: cc.Node, //玩家出牌了
        //谁是地主
        leftIsDizhu: cc.Node,
        rightIsDizhu: cc.Node,
        playerIsDizhu: cc.Node,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {

        this.socketAction();
        this.loadRes();
        this.setIndex();
    },
    /**
     * 离开房间
     */
    leaveRoom() {
        window.Network.socket.emit('leaveRoom', Global.roomNum, Global.roomIndex);
    },
    /**
     * socket处理
     */
    socketAction() {
        if (window.Network.socket == null) {
            //启动网络
            window.Network.initwindow.Network();
        }
        let self = this;
        // window.Network.socket.on('hello', function (msg) {
        //     console.log(msg);
        // });
        console.log(Global.roomNum)
        //准备开始
        this.socketOn();

    },
    //加载卡片资源
    loadRes() {

        let self = this;
        cc.loader.loadRes('poker', cc.SpriteAtlas, function (err, assets) {
            console.log('====' + assets);

            let sflist = assets.getSpriteFrames();
            for (let i = 0; i < sflist.length; i++) {
                let sf = sflist[i];
                self.pokerSpriteFrameMap[sf._name] = sf;
            }
            console.log("获取完全部Poker")
        });

    },
    //测试获取Poker
    startPoker() {
        if (this.playerReady.string == "已准备") {
            this.playerReady.string = "请准备"
        } else {
            this.playerReady.string = "已准备"
        }


        window.Network.socket.emit('readyGame', Global.roomNum, Global.roomIndex);

    },
    //洗牌算法
    shuffleArray(array) {
        for (var i = array.length - 1; i > 0; i--) {
            // 在正数的时候相当于Math.floor()向下取整,负数的时候相当于Math.ceil()：
            var j = (Math.random() * (i + 1)) | 0;
            // console.log(j);
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    },
    /**
     * 重新发牌开始
     */
    restartGame() {

        //清空页面的一些东西
        let playerHandCardsShow = this.playerHandCards.getComponent('ShowPoker');
        playerHandCardsShow.desTroyPokers(new Array());

        let out = this.playerOutCards.getComponent('ShowPoker');
        out.desTroyPokers(new Array());

        let dipai = this.dipaiShowPoker.getComponent('ShowPoker');
        dipai.desTroyPokers(new Array());

        let left = this.leftShowPoker.getComponent('ShowPoker');
        left.desTroyPokers(new Array());

        let right = this.rightShowPoker.getComponent('ShowPoker');
        right.desTroyPokers(new Array());
    },
    testBtn() {
        window.Network.socket.emit('restarGame', Global.roomNum, Global.roomIndex);
    },
    /**
     * 显示poker
     * @param {数字Poker} cards 
     * @param {展示位置} playerType 
     */
    startShowPokers(cards, playerType) {

        var pokerDatas = [];
        var pokers = this.loadAllPoker(cards);
        for (let i = 0; i < cards.length; i++) {
            let pokerSprite = pokers[i];
            pokerDatas[i] = pokerSprite;
        }
        //左边
        if (playerType == PlayerType.left) {
            this.leftPokersOut = pokerDatas;
            pokerTypes.bubbleSortCards(this.leftPokersOut);
        } else if (playerType == PlayerType.right) {
            this.rightPokersOut = pokerDatas;
            pokerTypes.bubbleSortCards(this.rightPokersOut);
        } else if (playerType == PlayerType.shoupai) {
            this.playerPokersOut = pokerDatas;
            pokerTypes.bubbleSortCards(this.playerPokersOut);
        }
        this.showCards(playerType);

    },
    //生成当前玩家
    startPlayer(cards) {
        this.playerPokers = [];
        var pokers = this.loadAllPoker(cards);
        for (let i = 0; i < cards.length; i++) {
            let pokerSprite = pokers[i];
            this.playerPokers[i] = pokerSprite;
        }
        pokerTypes.bubbleSortCards(this.playerPokers);
        this.showCards(PlayerType.player);
        //刷新数量
        this.refreshCount();
    },
    //生成三张底牌
    startDipai(cards) {
        this.dipaiPokers = [];
        var pokers = this.loadAllPoker(cards);
        for (let i = 0; i < cards.length; i++) {
            let pokerSprite = pokers[i];
            this.dipaiPokers[i] = pokerSprite;
        }
        this.showCards(PlayerType.dipai);
        // this.showPokers(this.dipaiPokers, PlayerType.dipai);
    },
    //调用子类的展示方法
    showCards(type) {
        if (type == PlayerType.left) {
            var showPoker = this.leftShowPoker.getComponent('ShowPoker');
            showPoker.showPokers(this.leftPokersOut, PlayerType.left);
        } else if (type == PlayerType.right) {
            var showPoker = this.rightShowPoker.getComponent('ShowPoker');
            showPoker.showPokers(this.rightPokersOut, PlayerType.right);
        } else if (type == PlayerType.player) {
            var showPoker = this.playerHandCards.getComponent('ShowPoker');
            showPoker.showPokers(this.playerPokers, PlayerType.player);
        } else if (type == PlayerType.shoupai) {
            //打出的牌
            var showPoker = this.playerOutCards.getComponent('ShowPoker');
            showPoker.showPokers(this.playerPokersOut, PlayerType.shoupai);
        } else {
            var showPoker = this.dipaiShowPoker.getComponent('ShowPoker');
            showPoker.showPokers(this.dipaiPokers, PlayerType.dipai);
        }
    },

    loadAllPoker(originCards) {

        var pokers = [];
        for (let i = 0; i < originCards.length; i++) {

            let pokerSprite = cc.instantiate(this.poker);
            var Poker = pokerSprite.getComponent('Poker');
            var pokerName = Poker.creatCard(originCards[i])._imageName;
            // console.log("名称" + pokerName);
            pokerSprite.getComponent(cc.Sprite).spriteFrame = this.pokerSpriteFrameMap[pokerName];

            pokers.push(pokerSprite);
        }
        return pokers;
    },

    //刷新显示数量
    refreshCount() {
        var self = this;
        window.Network.socket.emit('refreshCardsCount', Global.roomNum);

    },
    //设置Index
    setIndex() {
        if (Global.roomIndex == 0) {
            this.leftIndex = 2;
            this.rightIndex = 1;
        } else if (Global.roomIndex == 1) {
            this.leftIndex = 0;
            this.rightIndex = 2;
        } else {
            this.leftIndex = 1;
            this.rightIndex = 0;
        }
    },
    //设置提示的显示
    setTip(index) {
        this.leftTip.active = (index == this.leftIndex);
        this.rightTip.active = (index == this.rightIndex);
        this.playerTip.active = (index == Global.roomIndex);
    },
    /**
     * socket接收处理
     */
    socketOn() {
        var self = this;
        window.Network.socket.on("readyGame" + Global.roomNum, function (roomIndex) {
            if (roomIndex == self.leftIndex) {
                self.leftReady.string = "准备";
            } else if (roomIndex == self.rightIndex) {
                self.rightReady.string = "准备";
            } else {

            }
        });
        //错误信息
        window.Network.socket.on('errorPlay', function (errorMes) {
            alert(errorMes);
        });
        //获取所有Poker
        window.Network.socket.on('startGame' + Global.roomNum, function (playerIndex) {
            self.restartGame();
            //隐藏控件
            self.maskBackground.active = false;

            self.leftbuchu.string = "";

            self.rightbuchu.string = "";

            self.playerbuchu.string = "";

            self.playerAction.active = false;

            self.playerDizhuAction.active = false;
            //地主标志
            self.leftIsDizhu.active = false;
            self.rightIsDizhu.active = false;
            self.playerIsDizhu.active = false;


            if (playerIndex == Global.roomIndex) {

                self.playerDizhuAction.active = true;
            }
            //当前操作对象
            self.setTip(playerIndex);

            window.Network.socket.emit('getCards', Global.roomNum, Global.roomIndex);

        });
        window.Network.socket.on('getCardsBack' + Global.roomNum, function (cards) {
            console.log(cards);
            self.startPlayer(cards);
        });
        window.Network.socket.on('getDipaiCardsBack' + Global.roomNum, function (cards) {
            console.log(cards);
            self.startDipai(cards);
        });
        //有人抢地主
        window.Network.socket.on('qiangdizhuResult', function (msg) {

            console.log(msg);
            let data = window.Network.parseJson(msg);
            let playerIndex = data.index;
            let qiangdizhu = data.qiangdizhuResult;
            let str = data.str;

            if (playerIndex == self.leftIndex) {
                self.leftbuchu.string = str;
            } else if (playerIndex == self.rightIndex) {
                self.rightbuchu.string = str;
            } else {
                self.playerbuchu.string = str;
            }

        });
        //目前抢地主用户
        window.Network.socket.on('qiangdizhuNotice', function (msg) {
            let data = window.Network.parseJson(msg);
            let isFirst = data.isFirst;
            //当前操作对象
            self.setTip(data.nextIndex);

            if (data.nextIndex == Global.roomIndex) {
                self.playerDizhuAction.active = true;
                self.playerbuchu.string = "";
            } else {
                self.playerDizhuAction.active = false;
            }
            //叫地主和抢地主
            if (isFirst) {
                let dizhuNode = self.playerDizhuAction.getComponent('playerDizhuAction');
                dizhuNode.setFirst(true);
            } else {
                let dizhuNode = self.playerDizhuAction.getComponent('playerDizhuAction');
                dizhuNode.setFirst(false);
            }

        });
        //开始出牌
        window.Network.socket.on('startPlayerPoker', function (playerIndex) {
            console.log("地主为:" + playerIndex);
            //存储地主人员
            Global.dizhuIndex = playerIndex;

            self.playerDizhuAction.active = false;
            self.leftbuchu.string = "";
            self.rightbuchu.string = "";
            self.playerbuchu.string = "";
            //当前操作对象
            self.setTip(playerIndex);
            //展示底牌
            window.Network.socket.emit('getCards', Global.roomNum, 3);
            if (playerIndex == self.leftIndex) {
                //地主标志
                self.leftIsDizhu.active = true;
                self.leftbuchu.string = "出牌";
                self.refreshCount()

            } else if (playerIndex == self.rightIndex) {
                self.rightIsDizhu.active = true;
                self.rightbuchu.string = "出牌";
                self.refreshCount()

            } else {
                self.playerIsDizhu.active = true;
                self.playerAction.active = true;
                window.Network.socket.emit('getCards', Global.roomNum, Global.roomIndex);
                //重置poker
                var showPoker = self.playerHandCards.getComponent('ShowPoker');
                showPoker.pokerAllDown();
            }
        });

        window.Network.socket.on('playerAction', function (mes) {
            let data = window.Network.parseJson(mes);

            let playerIndex = data.nextIndex;
            let isFirst = data.isFirst;
            Global.isFirst = isFirst;
            Global.lastPokerType = data.lastPokerType;

            let actionNode = self.playerAction.getComponent('playerAction');
            actionNode.setBuchu(isFirst);

            //当前操作对象
            self.setTip(playerIndex);
            if (playerIndex == Global.roomIndex) {
                self.playerbuchu.string = "";
                self.playerAction.active = true;
                let blank = new Array();
                self.startShowPokers(blank, PlayerType.shoupai);
            }

            // self.restartGame();

        });
        //不出
        window.Network.socket.on('buchu', function (playerIndex) {
            let blank = new Array();
            if (playerIndex == self.leftIndex) {
                self.leftbuchu.string = "不出";

                self.startShowPokers(blank, PlayerType.left);
            } else if (playerIndex == self.rightIndex) {
                self.rightbuchu.string = "不出";
                self.startShowPokers(blank, PlayerType.right);
            } else {
                self.playerAction.active = false;
                self.playerbuchu.string = "不出"
                self.startShowPokers(blank, PlayerType.shoupai);
                //重置poker
                var showPoker = self.playerHandCards.getComponent('ShowPoker');
                showPoker.pokerAllDown();
            }
        });
        //出牌
        window.Network.socket.on('chupai', function (mes) {
            let data = window.Network.parseJson(mes);
            let playerIndex = data.playerIndex;
            let pokers = data.pokers;

            //存储上一手牌
            var pokerSprites = self.loadAllPoker(pokers);
            Global.lastPokers = pokerSprites;

            if (playerIndex == self.leftIndex) {
                self.leftbuchu.string = "";
                self.refreshCount()
                //出的牌
                self.startShowPokers(pokers, PlayerType.left);
            } else if (playerIndex == self.rightIndex) {
                self.rightbuchu.string = "";
                self.refreshCount()
                //出的牌
                self.startShowPokers(pokers, PlayerType.right);
            } else {
                self.playerAction.active = false;
                //手牌
                window.Network.socket.emit('getCards', Global.roomNum, Global.roomIndex);
                //出的牌
                self.startShowPokers(pokers, PlayerType.shoupai);
                //重置poker
                var showPoker = self.playerHandCards.getComponent('ShowPoker');
                showPoker.pokerAllDown();
            }
        });
        window.Network.socket.on('gameOver', function (playerIndex) {
            if (playerIndex == Global.dizhuIndex) {
                console.log("地主胜利")
                //我是地主
                if (Global.dizhuIndex == Global.roomIndex) {
                    console.log("我赢了")
                    self.resultLabel.string = "地主胜利--You Win";
                } else {
                    console.log("我输了")
                    self.resultLabel.string = "地主胜利--You Lose";
                }
            } else {
                console.log("农民胜利")
                //我是地主
                if (Global.dizhuIndex == Global.roomIndex) {
                    console.log("我输了")
                    self.resultLabel.string = "农名胜利--You Lose";
                } else {
                    console.log("我赢了")
                    self.resultLabel.string = "农名胜利--You Win";
                }
            }
            self.onGameover();
        });
        window.Network.socket.on('refreshCardsCountBack' + Global.roomNum, function (datas) {
            console.log(datas);
            self.leftCount.string = "" + datas[self.leftIndex];
            self.rightCount.string = "" + datas[self.rightIndex];
        });
        // Network.socket.on('leaveRoom' , function (playerIndex) {
        //     if (Global) {

        //     }
        // });
    },
    onGameover() {
        let self = this;
        //清空数据
        Global.allPokers = []  //所有牌
        Global.selectPokers = []    //选择的牌
        Global.isFirst = true       //是否为第一手牌
        Global.lastPokerType = 14
        Global.lastPokers = []
        Global.dizhuIndex = -1 //地主是谁
debugger;
        self.maskBackground.active = true;
        self.rightReady.string = "准备";
        self.leftReady.string = "准备";
        self.playerReady.string = "请准备"
    },
    start() {

    },

    // update (dt) {

    // },
});
