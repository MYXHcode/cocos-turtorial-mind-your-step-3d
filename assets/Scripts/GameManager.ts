/**
 * @author MYXH <1735350920@qq.com>
 * @license GNU GPL v3
 * @version 0.0.1
 * @date 2025-04-23
 * @description 游戏管理器
 */

import { _decorator, Component, Prefab, instantiate, Node } from "cc";
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

    private _road: BlockType[] = [];

    start() {}

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
        for (let j = 0; j < this._road.length; j++) {
            let block: Node = this.spawnBlockByType(this._road[j]);
            // 判断是否生成了道路，因为 spawnBlockByType 有可能返回坑（值为 null）
            if (block) {
                this.node.addChild(block);
                // 设置块的位置，每个块之间的间隔为 j
                block.setPosition(j, -1.5, 0);
            }
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
}
