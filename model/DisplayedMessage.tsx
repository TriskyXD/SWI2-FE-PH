import {ChatUser} from "../interface/ChatUser";

export interface DisplayedMessage {
    type: string;
    content: string;
    sender: ChatUser;
}