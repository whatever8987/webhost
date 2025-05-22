// client/src/pages/Blog.tsx
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BlogPostList as DjangoBlogPostList, PaginatedBlogPostListList as PaginatedBlogPostListResponse, CategoryEnum } from "@/api/models";
import { BlogApi } from "@/api/apis";
import { configuration } from "@/api/api";

import { Link } from "wouter";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const categories = [
  { label: "All Categories", value: "all" },
  { label: "Nail Art", value: CategoryEnum.NailArt },
  { label: "Marketing", value: CategoryEnum.Marketing },
  { label: "Business Advice", value: CategoryEnum.BusinessAdvice },
  { label: "Trends", value: CategoryEnum.Trends },
  { label: "Product Reviews", value: CategoryEnum.ProductReviews },
  { label: "Tutorials", value: CategoryEnum.Tutorials },
  { label: "Other", value: CategoryEnum.Other },
];

export default function Blog() {
  const { t } = useTranslation();
  const [categoryFilter, setCategoryFilter] = useState<CategoryEnum | 'all'>("all");
  const [page] = useState(1);

  const blogApi = new BlogApi(configuration);

  const { data: postsResponse, isLoading, error: blogListError } = useQuery<PaginatedBlogPostListResponse>({
    queryKey: ["blogPosts", { category: categoryFilter, page }],
    queryFn: async () => {
      const params = {
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        published: true,
        page
      };

      const response = await blogApi.blogPostsList(params);
      return response;
    },
    select: (data) => data.results,
    retry: 1,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const getExcerpt = (post: DjangoBlogPostList) => {
    if (post.excerpt) return post.excerpt;
    const text = post.content?.replace(/[#*_`]/g, '').split('\n').join(' ') || '';
    return text.length > 150 ? text.substring(0, 147) + '...' : text;
  };

  const filteredPosts = useMemo(() => {
    return postsResponse?.filter(post => !post.featured) || [];
  }, [postsResponse]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Loading blog posts...</span>
      </div>
    );
  }

  if (blogListError) {
    let errorMessage = "There was an issue loading the blog posts.";
    if (blogListError instanceof Error) {
      errorMessage = blogListError.message;
    } else if (typeof blogListError === 'string') {
      errorMessage = blogListError;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4 text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Error Loading Blog Posts</h1>
        <p className="text-gray-700 mb-6">{errorMessage}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
        <Link href="/">
          <Button variant="outline" className="mt-4">
            Return Home
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" aria-label="Blog posts">
            {t('blog.title')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('blog.description')}
          </p>
        </div>

        <div className="flex justify-end mb-8">
          <div className="w-64">
            <Select
              value={categoryFilter}
              onValueChange={(value) => setCategoryFilter(value as CategoryEnum | 'all')}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('blog.selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {postsResponse && postsResponse.length > 0 && postsResponse.some(post => post.featured) && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">{t('blog.featuredPost')}</h2>
            {(() => {
              const featuredPost = postsResponse.find(post => post.featured);
              if (!featuredPost) return null;

              return (
                <Card className="overflow-hidden">
                  {featuredPost.cover_image && (
                    <div className="h-72 overflow-hidden">
                      <img
                        src={featuredPost.cover_image}
                        alt={featuredPost.title || 'Featured post'}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={(e) => { 
                          e.currentTarget.src = 'https://via.placeholder.com/800x400?text=No+Image'; 
                          e.currentTarget.onerror = null; 
                        }}
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex justify-between items-center mb-2">
                      <Badge variant="secondary">
                        {categories.find(c => c.value === featuredPost.category)?.label || featuredPost.category}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {formatDate(featuredPost.published_at)}
                      </span>
                    </div>
                    <CardTitle className="text-2xl">
                      {featuredPost.title || 'Untitled Post'}
                    </CardTitle>
                    <CardDescription>
                      {getExcerpt(featuredPost) || 'No content available'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                          {featuredPost.view_count} {t('blog.views')}
                        </span>
                        <span className="text-sm text-gray-500">
                          {featuredPost.comments_count} {t('blog.comments')}
                        </span>
                      </div>
                      <Link href={`/blog/${featuredPost.slug}`}>
                        <Button variant="outline">{t('blog.readMore')}</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <Card key={post.id} className="flex flex-col">
                {post.cover_image && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={post.cover_image}
                      alt={post.title || 'Blog post'}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => { 
                        e.currentTarget.src = 'https://via.placeholder.com/800x400?text=No+Image'; 
                        e.currentTarget.onerror = null; 
                      }}
                    />
                  </div>
                )}
                <CardHeader className="flex-grow">
                  <div className="flex justify-between items-center mb-2">
                    <Badge variant="secondary">
                      {categories.find(c => c.value === post.category)?.label || post.category}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {formatDate(post.published_at)}
                    </span>
                  </div>
                  <CardTitle>{post.title || 'Untitled Post'}</CardTitle>
                  <CardDescription>
                    {getExcerpt(post) || 'No content available'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {post.view_count} {t('blog.views')}
                      </span>
                      <span className="text-sm text-gray-500">
                        {post.comments_count} {t('blog.comments')}
                      </span>
                    </div>
                    <Link href={`/blog/${post.slug}`}>
                      <Button variant="outline">{t('blog.readMore')}</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-3 text-center py-12">
              <p className="text-lg text-gray-500">{t('blog.noPosts')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}