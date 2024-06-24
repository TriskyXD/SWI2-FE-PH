import { ChatRoom } from "./ChatRoom";
import { DisplayedMessage } from "./DisplayedMessage";

export interface ChatObject {
    chat: ChatRoom;
    queues: string[];
    messages: DisplayedMessage[];
    seen: boolean
}