/**
 * @author MYXH <1735350920@qq.com>
 * @license GNU GPL v3
 * @version 0.0.1
 * @date 2025-04-23
 * @description 游戏管理器
 */

import {
    _decorator,
    Component,
    Prefab,
    instantiate,
    Node,
    Label,
    Vec3,
} from "cc";
import { PlayerController } from "./PlayerController";
const { ccclass, property } = _decorator;

/**
 * @description 赛道格子类型，坑（BT_NONE）或者实路（BT_STONE）
 */
enum BlockType {
    /**
     * @description 无
     */
    BT_NONE = "None",

    /**
     * @description 石头
     */
    BT_STONE = "Stone",
}

/**
 * @description 游戏状态
 */
enum GameState {
    /**
     * @description 初始化
     */
    GS_INIT = "Init",

    /**
     * @description 游戏中
     */
    GS_PLAYING = "Playing",

    /**
     * @description 结束
     */
    GS_END = "End",
}

@ccclass("GameManager")
export class GameManager extends Component {
    /**
     * @description 赛道预制
     */
    @property({ type: Prefab })
    public cubePrfb: Prefab | null = null;

    /**
     * @description 赛道长度
     */
    @property
    public roadLength = 50;

    /**
     * @description 路径
     */
    private _road: BlockType[] = [];

    /**
     * @description 主界面根节点
     */
    @property({ type: Node })
    public startMenu: Node | null = null;

    /**
     * @description 关联 Player 节点身上 PlayerController 组件
     */
    @property({ type: PlayerController })
    public playerCtrl: PlayerController | null = null;

    /**
     * @description 关联步长文本组件
     */
    @property({ type: Label })
    public stepsLabel: Label | null = null;

    start() {
        // 第一个初始化要在 start 里面调用
        this.curState = GameState.GS_INIT;

        // '?.' 是 Typescript 的可选链写法
        // 相当于：
        // if(this.playerCtrl != null) this.playerCtrl.node.on('JumpEnd', this.onPlayerJumpEnd, this);
        // 可选链的写法更加的简洁
        this.playerCtrl?.node.on("JumpEnd", this.onPlayerJumpEnd, this);
    }

    /**
     * @description 初始化
     * @returns void
     */
    init() {
        // 激活主界面
        if (this.startMenu) {
            this.startMenu.active = true;
        }

        // 生成赛道
        this.generateRoad();

        // 将角色放回到初始点
        if (this.playerCtrl) {
            // 禁止接收用户操作人物移动指令
            this.playerCtrl.setInputActive(false);

            // 重置人物位置
            this.playerCtrl.node.setPosition(Vec3.ZERO);

            // 重置已经移动的步长数据
            this.playerCtrl.reset();
        }
    }

    /**
     * @description 设置当前状态
     * @param value 游戏状态
     * @returns void
     */
    set curState(value: GameState) {
        switch (value) {
            case GameState.GS_INIT:
                this.init();
                break;
            case GameState.GS_PLAYING:
                // 隐藏 StartMenu
                if (this.startMenu) {
                    this.startMenu.active = false;
                }

                // 重设计步器的数值
                if (this.stepsLabel) {
                    // 将步数重置为0
                    this.stepsLabel.string = "0";
                }

                // 设置 active 为 true 时会直接开始监听鼠标事件，此时鼠标抬起事件还未派发
                // 会出现的现象就是，游戏开始的瞬间人物已经开始移动
                // 因此，这里需要做延迟处理
                // 直接设置 active 会直接开始监听鼠标事件，这里做了延迟处理
                setTimeout(() => {
                    if (this.playerCtrl) {
                        this.playerCtrl.setInputActive(true);
                    }
                }, 0.1);
                break;
            case GameState.GS_END:
                break;
        }
    }

    /**
     * @description 生成路径
     * @returns void
     */
    generateRoad() {
        // 防止游戏重新开始时，赛道还是旧的赛道
        // 因此，需要移除旧赛道，清除旧赛道数据
        this.node.removeAllChildren();
        this._road = [];

        // 确保游戏运行时，人物一定站在实路上
        this._road.push(BlockType.BT_STONE);

        // 确定好每一格赛道类型
        for (let i = 1; i < this.roadLength; i++) {
            // 如果上一格赛道是坑，那么这一格一定不能为坑
            if (this._road[i - 1] === BlockType.BT_NONE) {
                // 如果前一个块是 BT_NONE，则当前块为 BT_STONE
                this._road.push(BlockType.BT_STONE);
            } else {
                // 否则，随机生成 0 或 1
                this._road.push(
                    Math.floor(Math.random() * 2) === 0
                        ? BlockType.BT_NONE
                        : BlockType.BT_STONE
                );
            }
        }

        // 根据赛道类型生成赛道
        let linkedBlocks = 0;

        // 遍历赛道
        for (let j = 0; j < this._road.length; j++) {
            // 如果当前块是 BT_STONE，则增加链接块的数量
            if (this._road[j] === BlockType.BT_STONE) {
                // 增加链接块的数量
                ++linkedBlocks;
            }

            // 如果当前块是 BT_NONE，则生成块
            if (this._road[j] === BlockType.BT_NONE) {
                if (linkedBlocks > 0) {
                    this.spawnBlockByCount(j - 1, linkedBlocks);
                    linkedBlocks = 0;
                }
            }

            // 如果当前块是最后一个块，则生成块
            if (this._road.length == j + 1) {
                if (linkedBlocks > 0) {
                    this.spawnBlockByCount(j, linkedBlocks);
                    linkedBlocks = 0;
                }
            }
        }
    }

    /**
     * @description 根据上一个块的位置和数量生成块
     * @param lastPos 上一个块的位置
     * @param count 数量
     */
    spawnBlockByCount(lastPos: number, count: number) {
        // 根据上一个块的位置和数量生成块
        let block: Node | null = this.spawnBlockByType(BlockType.BT_STONE);

        // 判断是否生成了道路，因为 spawnBlockByType 有可能返回坑（值为 null）
        if (block) {
            // 设置块的位置，每个块之间的间隔为 j
            this.node.addChild(block);

            // 设置块的数量和位置
            block?.setScale(count, 1, 1);

            // 设置块的位置，每个块之间的间隔为 j
            block?.setPosition(lastPos - (count - 1) * 0.5, -1.5, 0);
        }
    }

    /**
     * @description 根据块类型生成块节点
     * @param type 块类型
     * @returns 块节点
     */
    spawnBlockByType(type: BlockType) {
        if (!this.cubePrfb) {
            // 如果没有预制体，则返回 null
            return null;
        }

        let block: Node | null = null;

        // 赛道类型为实路才生成
        switch (type) {
            case BlockType.BT_STONE:
                // 如果块类型是 BT_STONE，则生成 boxPrefab 的实例
                block = instantiate(this.cubePrfb);
                break;
        }

        return block;
    }

    /**
     * @description 开始按钮点击
     * @returns void
     */
    onStartButtonClicked() {
        // 点击主界面 Play 按钮，开始游戏
        this.curState = GameState.GS_PLAYING;
    }

    /**
     * @description 检查结果
     * @param moveIndex 移动的索引
     */
    checkResult(moveIndex: number) {
        if (moveIndex < this.roadLength) {
            // 跳到了坑上
            if (this._road[moveIndex] === BlockType.BT_NONE) {
                //跳到了空方块上
                this.curState = GameState.GS_END;
            }
        } else {
            // 跳过了最大长度
            this.curState = GameState.GS_END;
        }
    }

    /**
     * @description 角色跳跃结束事件
     * @param moveIndex 移动的索引
     * @returns void
     */
    onPlayerJumpEnd(moveIndex: number) {
        // 检查 stepsLabel 是否存在，如果存在则更新其显示内容
        if (this.stepsLabel) {
            // 因为在最后一步可能出现步伐大的跳跃，但是此时无论跳跃是步伐大还是步伐小都不应该多增加分数
            this.stepsLabel.string =
                "" +
                (moveIndex >= this.roadLength ? this.roadLength : moveIndex);
        }

        // 调用 checkResult 方法，传入当前移动的索引，检查游戏结果
        this.checkResult(moveIndex);
    }
}
