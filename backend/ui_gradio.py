"""
Gradio Web UI for Semantic Code Search
A beautiful, user-friendly web interface for searching code using natural language.
"""

import gradio as gr
from search import CodeSearcher
from reasoning import generate_change_plan


def search_code(
    query: str,
    limit: int,
    mode: str,
    language_filter: str,
    repo_filter: str,
    qdrant_url: str,
    collection_name: str,
    embedding_model: str
):
    """Search code or generate a change plan.

    When ``mode`` is "search" this returns formatted result snippets as HTML.
    When ``mode`` is "plan" it calls Gemini to generate a structured change
    plan and renders that plan as HTML.
    """
    if not query.strip():
        return "Please enter a search query"
    
    try:
        # Initialize searcher
        searcher = CodeSearcher(
            qdrant_url=None,
            collection_name=collection_name,
            embedding_model=embedding_model
        )
        # Manually override to use local path in searcher
        searcher.client = QdrantClient(path="./qdrant_db")
        
        # Perform search (used for both modes)
        results = searcher.search(
            query=query,
            limit=limit,
            language_filter=language_filter.strip() if language_filter else None,
            repo_filter=repo_filter.strip() if repo_filter else None
        )
        
        if not results:
            return """
            <div style="text-align: center; padding: 40px; color: #666;">
                <h3>No results found</h3>
                <p>Try a different query or check your collection.</p>
            </div>
            """

        if mode == "plan":
            plan = generate_change_plan(query, results)
            # Render plan as structured HTML for readability.
            html_output = """
            <div style="margin-bottom: 20px;">
                <h2 style="color: #2563eb; margin-bottom: 10px;">Proposed Change Plan</h2>
                <hr style="border: 1px solid #e5e7eb;">
            </div>
            """

            goal = plan.get("goal", "")
            summary = plan.get("existing_logic_summary", "")
            html_output += f"""
            <div style="margin-bottom: 20px; padding: 16px; background: #0b1120; border-radius: 12px; border: 1px solid #1f2937;">
                <h3 style="color: #e5e7eb;">Goal</h3>
                <p style="color: #e5e7eb;">{goal}</p>
                <h3 style="color: #e5e7eb; margin-top: 12px;">Existing Logic Summary</h3>
                <p style="color: #e5e7eb;">{summary}</p>
            </div>
            """

            files = plan.get("files_to_modify", [])
            if files:
                html_output += "<h3 style='color: #e5e7eb;'>Files to Modify</h3>"
                for f in files:
                    lines = f.get("relevant_lines") or []
                    line_text = ""
                    if len(lines) == 2:
                        line_text = f" (lines {lines[0]}-{lines[1]})"
                    html_output += f"""
                    <div style="margin-bottom: 10px; padding: 10px; background: #111827; border-radius: 8px; border: 1px solid #1f2937;">
                        <strong style="color: #e5e7eb;">{f.get('file_path','')}</strong>{line_text}<br>
                        <span style="color: #9ca3af;">{f.get('reason','')}</span>
                    </div>
                    """

            changes = plan.get("suggested_changes", [])
            if changes:
                html_output += "<h3 style='color: #e5e7eb; margin-top: 16px;'>Suggested Changes</h3>"
                for c in changes:
                    considerations = c.get("important_considerations") or []
                    cons_html = ""
                    if considerations:
                        items = "".join(
                            f"<li>{x}</li>" for x in considerations
                        )
                        cons_html = f"<ul style='margin-top: 6px; color: #e5e7eb;'>{items}</ul>"
                    html_output += f"""
                    <div style="margin-bottom: 10px; padding: 10px; background: #111827; border-radius: 8px; border: 1px solid #1f2937;">
                        <div style="color: #e5e7eb;"><strong>{c.get('file_path','')}</strong> &mdash; {c.get('change_type','')}</div>
                        <div style="color: #9ca3af; margin-top: 4px;">{c.get('summary','')}</div>
                        {cons_html}
                    </div>
                    """

            tests = plan.get("tests_to_update", [])
            if tests:
                html_output += "<h3 style='color: #e5e7eb; margin-top: 16px;'>Tests to Update</h3>"
                for t in tests:
                    html_output += f"""
                    <div style="margin-bottom: 10px; padding: 10px; background: #111827; border-radius: 8px; border: 1px solid #1f2937;">
                        <strong style="color: #e5e7eb;">{t.get('file_path','')}</strong><br>
                        <span style="color: #9ca3af;">{t.get('reason','')}</span>
                    </div>
                    """

            if not (files or changes or tests):
                html_output += "<p style='color: #9ca3af;'>No concrete suggestions were returned by the model.</p>"

            if "raw_response" in plan:
                html_output += """
                <details style="margin-top: 16px;">
                    <summary style="cursor: pointer; color: #60a5fa;">View raw model response (debug)</summary>
                    <pre style="white-space: pre-wrap; background: #020617; color: #e5e7eb; padding: 12px; border-radius: 8px;">{}</pre>
                </details>
                """.format(plan["raw_response"])

            return html_output

        # Default: render search results
        # Format results as HTML with better styling
        html_output = f"""
        <div style="margin-bottom: 20px;">
            <h2 style="color: #2563eb; margin-bottom: 10px;">Found {len(results)} results</h2>
            <hr style="border: 1px solid #e5e7eb;">
        </div>
        """
        
        for i, result in enumerate(results, 1):
            # Color code by score
            score_color = "#10b981" if result['score'] > 0.7 else "#f59e0b" if result['score'] > 0.5 else "#ef4444"
            
            html_output += f"""
            <div style="
                margin-bottom: 25px; 
                padding: 20px; 
                border: 2px solid #e5e7eb; 
                border-radius: 12px; 
                background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                transition: transform 0.2s;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="margin: 0; color: #1f2937;">[{i}] {result['file_path']}</h3>
                    <span style="
                        background-color: {score_color};
                        color: white;
                        padding: 5px 12px;
                        border-radius: 20px;
                        font-weight: bold;
                        font-size: 14px;
                    ">Score: {result['score']:.4f}</span>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-bottom: 15px;">
                    <div style="background: #f3f4f6; padding: 8px; border-radius: 6px;">
                        <strong style="color: #6b7280;">Repo:</strong> 
                        <span style="color: #1f2937;">{result['repo_name']}</span>
                    </div>
                    <div style="background: #f3f4f6; padding: 8px; border-radius: 6px;">
                        <strong style="color: #6b7280;">Language:</strong> 
                        <span style="color: #1f2937;">{result['language']}</span>
                    </div>
                    <div style="background: #f3f4f6; padding: 8px; border-radius: 6px;">
                        <strong style="color: #6b7280;">Lines:</strong> 
                        <span style="color: #1f2937;">{result['start_line']}-{result['end_line']}</span>
                    </div>
                    <div style="background: #f3f4f6; padding: 8px; border-radius: 6px;">
                        <strong style="color: #6b7280;">Type:</strong> 
                        <span style="color: #1f2937;">{result['chunk_type']}</span>
                    </div>
                </div>
                
                <details style="margin-top: 15px;">
                    <summary style="
                        cursor: pointer; 
                        color: #2563eb; 
                        font-weight: bold;
                        padding: 10px;
                        background: #eff6ff;
                        border-radius: 6px;
                        user-select: none;
                    ">
                        View Code Snippet
                    </summary>
                    <pre style="
                        background: #1f2937; 
                        color: #f9fafb;
                        padding: 15px; 
                        border-radius: 8px; 
                        overflow-x: auto; 
                        margin-top: 10px;
                        font-family: 'Courier New', monospace;
                        font-size: 13px;
                        line-height: 1.6;
                        border: 1px solid #374151;
                    "><code>{result['code_snippet']}</code></pre>
                </details>
            </div>
            """
        
        return html_output
    
    except ValueError as e:
        return f"""
        <div style="padding: 20px; background: #fef2f2; border: 2px solid #fecaca; border-radius: 8px; color: #991b1b;">
            <h3>Error</h3>
            <p>{str(e)}</p>
        </div>
        """
    except Exception as e:
        return f"""
        <div style="padding: 20px; background: #fef2f2; border: 2px solid #fecaca; border-radius: 8px; color: #991b1b;">
            <h3>Error</h3>
            <p>{str(e)}</p>
        </div>
        """


def get_collection_info(qdrant_url: str, collection_name: str):
    """Get information about the Qdrant collection."""
    try:
        searcher = CodeSearcher(
            qdrant_url=qdrant_url,
            collection_name=collection_name
        )
        info = searcher.client.get_collection(collection_name)
        return f"""
        <div style="
            padding: 20px; 
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        ">
            <h3 style="margin-top: 0; color: white;">Collection Found!</h3>
            <div style="display: grid; gap: 10px; margin-top: 15px;">
                <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 6px;">
                    <strong>Points:</strong> {info.points_count:,}
                </div>
                <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 6px;">
                    <strong>Vector Size:</strong> {info.config.params.vectors.size}
                </div>
                <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 6px;">
                    <strong>Distance:</strong> {info.config.params.vectors.distance}
                </div>
            </div>
        </div>
        """
    except Exception as e:
        return f"""
        <div style="padding: 20px; background: #fef2f2; border: 2px solid #fecaca; border-radius: 8px; color: #991b1b;">
            <h3>Error</h3>
            <p>{str(e)}</p>
        </div>
        """


def create_interface():
    """Create and launch the Gradio interface."""
    
    # Custom CSS for better styling
    custom_css = """
    .gradio-container {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .main-header {
        text-align: center;
        padding: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 12px;
        margin-bottom: 20px;
    }
    /* Improve visibility of results & errors */
    .results {
        background-color: #0f172a; /* dark slate */
        color: #e5e7eb;            /* light gray text */
        padding: 16px;
        border-radius: 12px;
        border: 1px solid #1f2937;
        max-height: 600px;
        overflow-y: auto;
    }
    .results h2, .results h3, .results p, .results span, .results div {
        color: inherit;
    }
    .results pre {
        background-color: #020617 !important;
        color: #e5e7eb !important;
    }
    .example-query {
        padding: 10px;
        background-color: #111827;
        color: #e5e7eb;
        border-radius: 6px;
        border: 1px solid #1f2937;
        cursor: pointer;
    }
    .example-query:hover {
        background-color: #020617;
    }
    """
    
    with gr.Blocks(
        title="Semantic Code Search",
        theme=gr.themes.Soft(primary_hue="blue"),
        css=custom_css
    ) as demo:
        
        # Header
        gr.Markdown("""
        <div class="main-header">
            <h1 style="margin: 0; font-size: 2.5em;">Semantic Code Search</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 1.1em;">
                Search your codebase using natural language queries powered by Qdrant vector search
            </p>
        </div>
        """)
        
        with gr.Row():
            with gr.Column(scale=3):
                # Main search interface
                with gr.Group():
                    gr.Markdown("### Search")
                    query_input = gr.Textbox(
                        label="Enter your search query",
                        placeholder='e.g., "read CSV file into dataframe", "authenticate user with JWT", "sort array in descending order"',
                        lines=3,
                        elem_classes=["search-box"]
                    )
                    
                    with gr.Row():
                        limit_slider = gr.Slider(
                            minimum=1,
                            maximum=20,
                            value=5,
                            step=1,
                            label="Number of Results",
                            info="Adjust how many results to display"
                        )

                    mode_radio = gr.Radio(
                        choices=["search", "plan"],
                        value="search",
                        label="Mode",
                        info="Search only, or also get a high-level change plan using Gemini",
                    )
                    
                    with gr.Row():
                        language_filter = gr.Textbox(
                            label="Language Filter (optional)",
                            placeholder="e.g., python, javascript",
                            scale=1
                        )
                        repo_filter = gr.Textbox(
                            label="Repository Filter (optional)",
                            placeholder="e.g., my-project",
                            scale=1
                        )
                    
                    search_btn = gr.Button(
                        "Search",
                        variant="primary",
                        size="lg",
                        scale=1
                    )
                
                # Results
                gr.Markdown("### Results")
                output = gr.HTML(label="", elem_classes=["results"])
            
            with gr.Column(scale=1):
                # Configuration panel
                with gr.Group():
                    gr.Markdown("### Configuration")
                    
                    qdrant_url_input = gr.Textbox(
                        label="Qdrant URL",
                        value="http://localhost:6333",
                        info="URL of your Qdrant instance"
                    )
                    
                    collection_name_input = gr.Textbox(
                        label="Collection Name",
                        value="code_search",
                        info="Name of the Qdrant collection"
                    )
                    
                    embedding_model_input = gr.Textbox(
                        label="Embedding Model",
                        value="BAAI/bge-small-en-v1.5",
                        info="FastEmbed model name"
                    )
                
                # Collection info
                with gr.Group():
                    gr.Markdown("### Collection Info")
                    info_btn = gr.Button("Check Collection", variant="secondary", size="lg")
                    info_output = gr.HTML()
        
        # Example queries
        with gr.Accordion("Example Queries", open=False):
            gr.Markdown("""
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px;">
                <div class="example-query" onclick="document.querySelector('textarea').value='database connection'">
                    database connection
                </div>
                <div class="example-query" onclick="document.querySelector('textarea').value='REST API endpoints'">
                    REST API endpoints
                </div>
                <div class="example-query" onclick="document.querySelector('textarea').value='hash password'">
                    hash password
                </div>
                <div class="example-query" onclick="document.querySelector('textarea').value='read CSV file'">
                    read CSV file
                </div>
                <div class="example-query" onclick="document.querySelector('textarea').value='JWT authentication'">
                    JWT authentication
                </div>
                <div class="example-query" onclick="document.querySelector('textarea').value='sort array descending'">
                    sort array descending
                </div>
            </div>
            """)
        
        # Footer
        gr.Markdown("""
        <div style="text-align: center; padding: 20px; color: #6b7280; margin-top: 30px;">
            <p>Built with love using <strong>Qdrant</strong>, <strong>FastEmbed</strong>, and <strong>Gradio</strong></p>
        </div>
        """)
        
        # Event handlers
        search_btn.click(
            fn=search_code,
            inputs=[
                query_input,
                limit_slider,
                mode_radio,
                language_filter,
                repo_filter,
                qdrant_url_input,
                collection_name_input,
                embedding_model_input
            ],
            outputs=output
        )
        
        info_btn.click(
            fn=get_collection_info,
            inputs=[qdrant_url_input, collection_name_input],
            outputs=info_output
        )
    
    return demo


def main():
    """Launch the Gradio interface."""
    demo = create_interface()
    demo.launch(
        server_name="127.0.0.1",
        server_port=7861,
        share=False,
        show_error=True,
        favicon_path=None
    )


if __name__ == "__main__":
    main()
