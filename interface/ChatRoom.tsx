import { ChatUser } from "./ChatUser";
import { ChatUsers } from "./ChatUsers";
import { DisplayedMessage } from "./DisplayedMessage";

export interface ChatRoom {
  id: number;
  chatName: string;
  exchange: string;
  owner: ChatUser;
  userQueues: ChatUsers[];
  messages: DisplayedMessage[];
}