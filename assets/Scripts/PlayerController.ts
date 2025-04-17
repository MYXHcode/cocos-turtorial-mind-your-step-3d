/**
 * @author MYXH <1735350920@qq.com>
 * @license GNU GPL v3
 * @version 0.0.1
 * @date 2025-04-17
 * @description 玩家控制器
 */

import {
    _decorator,
    Component,
    Vec3,
    input,
    Input,
    EventMouse,
    Animation,
} from "cc";
const { ccclass, property } = _decorator;

@ccclass("PlayerController")
export class PlayerController extends Component {
    /**
     * @description 是否接收到跳跃指令
     */
    private _startJump: boolean = false;

    /**
     * @description 跳跃步长：一步或者两步
     */
    private _jumpStep: number = 0;

    /**
     * @description 当前跳跃时间
     */
    private _curJumpTime: number = 0;

    /**
     * @description 每次跳跃时长
     */
    private _jumpTime: number = 0.1;

    /**
     * @description 当前跳跃速度
     */
    private _curJumpSpeed: number = 0;

    /**
     * @description 角色当前位置
     */
    private _curPos: Vec3 = new Vec3();

    /**
     * @description 每次跳跃过程中，当前帧移动位置差
     */
    private _deltaPos: Vec3 = new Vec3(0, 0, 0);

    /**
     * @description 角色目标位置
     */
    private _targetPos: Vec3 = new Vec3();

    start() {
        input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
    }

    /**
     * @description 鼠标抬起事件
     * @param event 鼠标事件
     * @returns void
     */
    onMouseUp(event: EventMouse) {
        // 0：左键，1：中键，2：右键
        if (event.getButton() === 0) {
            this.jumpByStep(1);
        } else if (event.getButton() === 2) {
            this.jumpByStep(2);
        }
    }

    /**
     * @description 跳跃
     * @param step 跳跃的步数 1 或者 2
     * @returns void
     */
    jumpByStep(step: number) {
        if (this._startJump) {
            return;
        }

        // 表示开始跳跃
        this._startJump = true;

        // 本次跳跃的步数，一步或者两步
        this._jumpStep = step;

        // 重置下跳跃的时间
        this._curJumpTime = 0;

        // 计算跳跃的速度
        this._curJumpSpeed = this._jumpStep / this._jumpTime;

        // 获取角色当前的位置
        this.node.getPosition(this._curPos);

        // 目标位置 = 当前位置 + 步长
        Vec3.add(this._targetPos, this._curPos, new Vec3(this._jumpStep, 0, 0));
    }

    /**
     * @description 更新
     * @param deltaTime 时间间隔
     * @returns void
     */
    update(deltaTime: number): void {
        if (this._startJump) {
            // 处理跳跃的分支逻辑
            this._curJumpTime += deltaTime;

            if (this._curJumpTime > this._jumpTime) {
                // 跳跃结束
                // 强制位移到目标位置
                this.node.setPosition(this._targetPos);

                // 标记跳跃结束
                this._startJump = false;
            } else {
                // 跳跃中
                // 获取当前的位置
                this.node.getPosition(this._curPos);

                // 计算本帧应该位移的长度
                this._deltaPos.x = this._curJumpSpeed * deltaTime;

                // 将当前位置加上位移的长度
                Vec3.add(this._curPos, this._curPos, this._deltaPos);

                // 设置位移后的位置
                this.node.setPosition(this._curPos);
            }
        }
    }
}
