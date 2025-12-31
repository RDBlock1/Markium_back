/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useState, useEffect } from "react"
import { NewsCard } from "./news-card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Loader2 } from "lucide-react"
import { getGoogleNewsArticles } from "@/app/actions/market"

interface GoogleNewsArticle {
  title: string
  link: string
  pubDate: string
  source: string
  description: string
  guid: string
}


export function NewsFeed({ slug }: { slug: string }) {
  const [articles, setArticles] = useState<GoogleNewsArticle[] | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)


  const loadNews = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    //get news from server action
    const news = await getGoogleNewsArticles(slug);
    if(news.articles.length > 0){
        setArticles(news.articles);
    }
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    loadNews()
  }, [])

  const handleRefresh = () => {
    loadNews(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading news...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 ">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-balance">Latest News</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2 bg-transparent"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:gap-6">
        {articles?.map((article, index) => (
          <div key={article.guid} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
            <NewsCard {...article} />
          </div>
        ))}
      </div>
    </div>
  )
}
