
MCP-to-OpenAI
=============

**Bridge an MCP chat tool to any OpenAI SDK compatible AI service API**

<p/>
<img src="https://nodei.co/npm/mcp-to-openai.png?downloads=true&stars=true" alt=""/>

<p/>
[![github (author stars)](https://img.shields.io/github/stars/rse?logo=github&label=author%20stars&color=%233377aa)](https://github.com/rse)
[![github (author followers)](https://img.shields.io/github/followers/rse?label=author%20followers&logo=github&color=%234477aa)](https://github.com/rse)

Abstract
--------

This is a small Command-Line Interface (CLI) for conveniently bridging
an MCP chat tool to any OpenAI SDK compatible AI service API. It runs
as an MCP stdio transport based server and remotely connects to the AI
service API with the OpenAI SDK. It supports both the legacy OpenAI
Completion API and the modern OpenAI Responses API. It allows accessing
foreign LLMs from within MCP host applications.

Installation
------------

```
$ npm install -g mcp-to-openai
```

Usage
-----

```
Usage: mcp-to-openai [options]

Bridge an MCP chat tool to any OpenAI SDK compatible AI service API

Options:
  -V, --version                 show program version information
  -s, --service <service>       name of AI service (env: SERVICE)
  -t, --mcp-tool <tool>         MCP tool name (env: MCP_TOOL)
  -u, --openai-url <url>        OpenAI API base URL (env: OPENAI_URL)
  -k, --openai-key <key>        OpenAI API access key (env: OPENAI_KEY)
  -a, --openai-api <api>        OpenAI API flavor to use (choices:
                                "completion", "responses", default:
                                "completion", env: OPENAI_API)
  -m, --openai-model <model>    OpenAI API model identifier (env: OPENAI_MODEL)
  -p, --openai-prompt <prompt>  OpenAI API system prompt (env: OPENAI_PROMPT)
  -T, --openai-timeout <ms>     OpenAI API request timeout (default: "30000",
                                env: OPENAI_TIMEOUT)
  -h, --help                    show this usage help

Example:
  $ claude mcp add \
    --scope user \
    --transport stdio \
    -- \
    chat-openai-chatgpt \
    mcp-to-openai \
      --service      "OpenAI ChatGPT" \
      --mcp-tool     chat-openai-chatgpt \
      --openai-url   https://api.openai.com/v1 \
      --openai-key   "sk-[...]" \
      --openai-api   responses \
      --openai-model gpt-5
```

License
-------

Copyright &mdash; 2026 Dr. Ralf S. Engelschall (http://engelschall.com/)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

