#!/usr/bin/env node
/*!
**  mcp-to-openai -- Bridge an MCP chat tool to any OpenAI SDK compatible AI service API
**  Copyright (c) 2025 Dr. Ralf S. Engelschall <rse@engelschall.com>
**  Distributed under MIT license <https://spdx.org/licenses/MIT.html>
*/

/*  built-in dependencies  */
import process                  from "node:process"

/*  external dependencies  */
import * as dotenvx             from "@dotenvx/dotenvx"
import { Command, Option }      from "commander"
import OpenAI                   from "openai"
import { McpServer }            from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z }                    from "zod"

/*  internal dependencies  */
import pkg                      from "./package.json" with { type: "json" }

/*  load potential .env file into the environment
    (optional, so stay silent if absent)  */
dotenvx.config({ quiet: true, ignore: [ "MISSING_ENV_FILE" ] })

/*  emit a fatal error and terminate the process  */
const fatal = (msg: string): never => {
    process.stderr.write(`${pkg.name}: ERROR: ${msg}\n`)
    process.exit(1)
}

/*  parse the command-line options (flags take precedence over environment variables)  */
const program = new Command()
program
    .name(pkg.name)
    .description("Bridge an MCP chat tool to any OpenAI SDK compatible AI service API")
    .version(`${pkg.name} ${pkg.version}`, "-V, --version", "show program version information")
    .helpOption("-h, --help", "show this usage help")
    .addOption(new Option("-s, --service <service>", "name of AI service")
        .env("SERVICE"))
    .addOption(new Option("-t, --mcp-tool <tool>", "MCP tool name")
        .env("MCP_TOOL"))
    .addOption(new Option("-u, --openai-url <url>", "OpenAI API base URL")
        .env("OPENAI_URL"))
    .addOption(new Option("-k, --openai-key <key>", "OpenAI API access key")
        .env("OPENAI_KEY"))
    .addOption(new Option("-a, --openai-api <api>", "OpenAI API flavor to use")
        .choices([ "completion", "responses" ])
        .env("OPENAI_API")
        .default("completion"))
    .addOption(new Option("-m, --openai-model <model>", "OpenAI API model identifier")
        .env("OPENAI_MODEL"))
    .addOption(new Option("-p, --openai-prompt <prompt>", "OpenAI API system prompt")
        .env("OPENAI_PROMPT"))
    .addOption(new Option("-T, --openai-timeout <ms>", "OpenAI API request timeout")
        .env("OPENAI_TIMEOUT").default("30000"))
    .addHelpText("after",
        "\n" +
        "Example:\n" +
        "  $ claude mcp add \\\n" +
        "    --scope user \\\n" +
        "    --transport stdio \\\n" +
        "    -- \\\n" +
        "    chat-openai-chatgpt \\\n" +
        `    ${pkg.name} \\\n` +
        "      --service      \"OpenAI ChatGPT\" \\\n" +
        "      --mcp-tool     chat-openai-chatgpt \\\n" +
        "      --openai-url   https://api.openai.com/v1 \\\n" +
        "      --openai-key   \"sk-[...]\" \\\n" +
        "      --openai-api   responses \\\n" +
        "      --openai-model gpt-5\n"
    )
    .allowExcessArguments(false)
    .parse()

const opts = program.opts<{
    service?:       string
    mcpTool?:       string
    openaiApi:      "completion" | "responses"
    openaiUrl?:     string
    openaiKey?:     string
    openaiModel?:   string
    openaiPrompt?:  string
    openaiTimeout:  string
}>()

/*  resolve the effective configuration and ensure all required values are present  */
const SERVICE          = opts.service     ?? fatal("service required (use --service or $SERVICE)")
const MCP_TOOL         = opts.mcpTool     ?? fatal("MCP tool required (use --mcp-tool or $MCP_TOOL)")
const OPENAI_API       = opts.openaiApi
const OPENAI_URL       = opts.openaiUrl   ?? fatal("OpenAI URL required (use --openai-url or $OPENAI_URL)")
const OPENAI_KEY       = opts.openaiKey   ?? fatal("OpenAI access key required (use --openai-key or $OPENAI_KEY)")
const OPENAI_MODEL     = opts.openaiModel ?? fatal("OpenAI model required (use --openai-model or $OPENAI_MODEL)")
const OPENAI_PROMPT    = opts.openaiPrompt
const OPENAI_TIMEOUT   = opts.openaiTimeout

/*  establish the OpenAI SDK client  */
const client = new OpenAI({
    baseURL: OPENAI_URL,
    apiKey:  OPENAI_KEY,
    timeout: parseInt(OPENAI_TIMEOUT, 10)
})

/*  establish the MCP server  */
const server = new McpServer({
    name:    pkg.name,
    version: pkg.version
})

/*  register the single tool which relays to the configured API  */
server.registerTool(
    MCP_TOOL,
    {
        title: `Chat with ${SERVICE}`,
        description:
            `Chat with ${SERVICE} AI service. ` +
            "Provide chat prompt in \"prompt\" parameter. " +
            "Receive chat response in \"text\" field.",
        inputSchema: {
            prompt: z.string()
                .describe(`The prompt to send to ${SERVICE} AI service.`)
        }
    },
    async ({ prompt }) => {
        if (!prompt)
            throw new Error("prompt is required")
        try {
            let responseContent: string | null | undefined
            if (OPENAI_API === "responses") {
                /*  call Responses API  */
                const response = await client.responses.create({
                    model: OPENAI_MODEL.trim(),
                    ...(OPENAI_PROMPT ? { instructions: OPENAI_PROMPT } : {}),
                    input: prompt
                })

                /*  determine response  */
                responseContent = response.output_text
            }
            else {
                /*  assemble chat messages  */
                const messages: OpenAI.ChatCompletionMessageParam[] = []
                if (OPENAI_PROMPT)
                    messages.push({ role: "system", content: OPENAI_PROMPT })
                messages.push({ role: "user", content: prompt })

                /*  call Completion API  */
                const completion = await client.chat.completions.create({
                    model: OPENAI_MODEL.trim(),
                    messages
                })

                /*  determine response  */
                responseContent = completion.choices[0]?.message?.content
            }
            if (!responseContent)
                throw new Error("no response content received from API")

            /*  tunnel response to MCP  */
            return {
                content: [ { type: "text", text: responseContent } ]
            }
        }
        catch (error: unknown) {
            /*  tunnel exception to MCP  */
            const err = error as
                { response?: { data?: { error?: { message?: string } } }, message?: string }
            const errorMessage =
                err?.response?.data?.error?.message ??
                err?.message ??
                "unknown error occurred"
            process.stderr.write(`${pkg.name}: WARNING: chat completion error: ${errorMessage}\n`)
            return {
                isError: true,
                content: [ { type: "text", text: `ERROR: ${errorMessage}` } ]
            }
        }
    }
)

/*  main entry point  */
async function main () {
    const transport = new StdioServerTransport()
    await server.connect(transport)
}
main().catch((error) => {
    const msg = error instanceof Error ? error.message : String(error)
    fatal(msg)
})

