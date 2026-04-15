import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { TicketCategory } from "@helpdesk/core";
import prisma from "./prisma";
import type { TicketModel } from "../generated/prisma/models/Ticket";

const VALID_CATEGORIES = Object.values(TicketCategory);

export async function classifyTicket(
    ticket: Pick<TicketModel, "id" | "subject" | "body">
): Promise<void> {
    const { text } = await generateText({
        model: openai("gpt-4.1-nano"),
        prompt: `Classify the following customer support ticket into exactly one of these categories: general_question, technical_question, refund_request.

        Subject: ${ticket.subject}
        Body: ${ticket.body}

        Reply with only the category name, nothing else.`,
    });

    const category = text.trim().toLowerCase() as TicketCategory;
    if (VALID_CATEGORIES.includes(category)) {
        await prisma.ticket.update({ where: { id: ticket.id }, data: { category } });
    }
}
