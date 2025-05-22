// client/src/pages/BlogPost.tsx
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
// Import generated API types
import { BlogPost as DjangoBlogPost, BlogComment as DjangoBlogComment, BlogCommentRequest } from "@/api/models"; // Adjust paths as needed
// Import generated API clients
import { BlogApi } from "@/api/apis"; // Adjust paths if needed
// Import shared configuration and error types
import { configuration } from "@/api/api"; // Assuming configuration is exported from api.ts
import { FetchError, ResponseError } from "@/api/runtime";

import { useParams, Link } from "wouter";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { z } from "zod"; // For form validation
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Assuming queryClient is exported from here if needed, otherwise remove
// import { queryClient, apiRequest } from "@/lib/queryClient"; // apiRequest is replaced

// Define the form schema using Zod, matching the BlogCommentRequest structure
const commentFormSchema = z.object({
  // post: z.number(), // The API expects post ID in the request body according to schema, but your original code sent it in the URL. Double check your backend or generated client. Generated client method blogPostsCommentsCreate expects slug in path, and BlogCommentRequest in body. Let's remove post ID from schema and pass slug in mutation.
  name: z.string().min(2, "Name must be at least 2 characters."), // Add client-side validation
  email: z.string().email("Invalid email address."), // Add client-side validation
  content: z.string().min(10, "Comment must be at least 10 characters."), // Add client-side validation
});

// Define the type for the form data
type CommentFormData = z.infer<typeof commentFormSchema>;

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>(); // Get slug from URL
  const { t } = useTranslation(); // Translation hook
  const { toast } = useToast(); // Toast hook
  const [showCommentForm, setShowCommentForm] = useState(false); // State for comment form visibility

  // Use the shared configuration object
  const blogApi = new BlogApi(configuration); // Instantiate BlogApi

  // Query blog post by slug
  // Use the correct return type from the generated API
  const { data: post, isLoading: isPostLoading, error: postError } = useQuery<DjangoBlogPost>({
    queryKey: [`/api/blog/posts/`, slug], // Query key includes slug
    queryFn: async () => {
       if (!slug) throw new Error("Blog post slug is missing."); // Ensure slug is available
       try {
            // Use the generated BlogApi method to retrieve the post by slug
            // The method name is likely based on operationId: blog_posts_retrieve
           const fetchedPost = await blogApi.blogPostsRetrieve({ slug: slug }); // Parameter name based on schema path variable {slug}
           return fetchedPost; // Returns the DjangoBlogPost object
       } catch (error) {
            console.error("Error fetching blog post:", error);
             if (error instanceof ResponseError && error.response?.status === 404) {
                 // Specific handling for 404 Not Found
                 toast({
                   title: t('blog.postNotFound'),
                   description: t('blog.postNotFoundDescription'),
                   variant: "destructive",
                 });
                 // Re-throw to mark query as error and trigger the !post check
                 throw new Error(t('blog.postNotFound'));
             }
             // For other errors (network, 500 etc.), log and let React Query handle error state
             console.error("Blog Post API Response Error:", error);
             throw error; // Re-throw other errors
       }
    },
     enabled: !!slug, // Only enable this query if slug is available
    retry: 0, // Do not retry on failure like 404
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });


  // Query approved comments for this post
  // Use the correct return type from the generated API
  // Note: This query depends on the post data being successfully loaded for the slug
  const { data: commentsResponse, isLoading: isCommentsLoading, error: commentsError } = useQuery<PaginatedBlogCommentList>({
    // Query key uses the post's slug (ensure post is loaded)
    queryKey: [`/api/blog/posts/`, post?.slug, `/comments/`],
    queryFn: async () => {
       const postSlug = post?.slug;
       // Only proceed if post data is loaded AND contains a slug
       if (!postSlug) {
           // This case is handled by 'enabled' flag, return empty array early
           return { count: 0, next: null, previous: null, results: [] } as PaginatedBlogCommentList; // Return empty paginated response structure
       }
       try {
           // Use the generated BlogApi method to list comments for a slug
           // The method name is likely based on operationId: blog_posts_comments_list
          const fetchedComments = await blogApi.blogPostsCommentsList({ slug: postSlug }); // Parameter name based on schema path variable {slug}
          return fetchedComments; // Returns the PaginatedBlogCommentList object
       } catch (error) {
            console.error("Error fetching comments:", error);
             // Handle error (e.g., log, display toast)
            throw error; // Re-throw the error
       }
    },
    // Enable this query ONLY if the post data has loaded and contains a slug
    enabled: !!post?.slug,
    retry: 1, // Retry once for network issues
    staleTime: 60 * 1000, // Comments might update more often
    gcTime: 5 * 60 * 1000,
  });

  // Format date for display
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


  // Comment form setup using react-hook-form and zod
  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      name: "",
      email: "",
      content: "",
       // post: post?.id, // Removed from schema, pass in mutation instead
    },
    // Reset form defaults when post data changes (e.g., navigating to a different post)
     values: {
        name: form.getValues('name'), // Keep current values if form is open
        email: form.getValues('email'),
        content: form.getValues('content'),
        // post: post?.id, // Removed from schema
     },
     resetOptions: { keepDirtyValues: true }, // Keep user input when defaults update
  });


  // Add comment mutation using react-query useMutation
  // Replaced custom apiRequest with generated client method
  const addCommentMutation = useMutation({
    mutationFn: async (data: CommentFormData) => {
      const postSlug = post?.slug;
      if (!postSlug) throw new Error("Post slug not available to add comment");

      try {
           // Use the generated BlogApi method to create a comment for a slug
           // The method name is likely based on operationId: blog_posts_comments_create
           // It expects slug as path parameter and BlogCommentRequest as body
           const commentPayload: BlogCommentRequest = {
               name: data.name,
               email: data.email,
               content: data.content,
                // The API schema indicates 'post' is required in BlogCommentRequest (integer).
                // However, the 'blogPostsCommentsCreate' operation itself takes the slug in the path.
                // This can be a discrepancy between schema definition and operation implementation.
                // Let's try sending the post ID in the body if the API *actually* expects it there despite the path.
                // If it doesn't like it, remove this 'post' line below.
               post: post.id // Sending post ID in body as per BlogCommentRequest schema
           };
          const createdComment = await blogApi.blogPostsCommentsCreate({
             slug: postSlug, // Pass slug as path parameter
             blogCommentRequest: commentPayload // Pass the payload object
          });
          return createdComment; // Returns the created BlogComment object
      } catch (error) {
          console.error("Error creating comment:", error);
          // Handle specific errors from the generated client's error types
           if (error instanceof ResponseError) {
                console.error("Comment API Response Error:", error.response?.status, error.message);
                // If the API returns validation errors, they might be in error.response.json()
                // You can parse them here and set form errors using form.setError()
                 const errorBody = await error.response.json(); // Try parsing error body
                 console.error("Comment Error Body:", errorBody); // Log for inspection
                 // Example: if errorBody has { name: ["..."], content: ["..."] }
                 if (typeof errorBody === 'object' && errorBody !== null) {
                    for (const field in errorBody) {
                        if (form.get either('name', 'email', 'content', or general)) { // Check if Zod schema knows the field
                            form.setError(field as keyof CommentFormData, { // Set form error
                                type: 'server',
                                message: Array.isArray(errorBody[field]) ? errorBody[field].join(', ') : String(errorBody[field])
                            });
                        } else if ('detail' in errorBody) {
                            // Handle a general 'detail' error message from the API
                            throw new Error(errorBody.detail); // Throw a general error for toast
                        } else {
                             // Handle other unexpected error formats
                            throw new Error("Failed to add comment due to invalid data."); // Throw generic error
                        }
                    }
                     // If field errors were set, don't throw a generic error
                    if (Object.keys(errorBody).some(key => form.getFieldState(key as any))) { // Check if any known field had errors set
                        throw new Error("Failed to add comment. Please check the fields above."); // Throw a slightly more helpful error
                    }
                 } else {
                     // If error body is not a standard object or detail
                    throw new Error(`Failed to add comment. Server error: ${error.response?.status}`); // Throw generic error
                 }


           } else if (error instanceof FetchError) {
               console.error("Network or low-level fetch error adding comment:", error.cause);
               throw new Error("Network error. Could not submit comment.");
           } else {
              console.error("Other error adding comment:", error);
              throw new Error("An unexpected error occurred while adding comment.");
           }
      }
    },
    onSuccess: (createdComment) => {
       // Invalidate the comments query cache to refetch the list
      // Use the query key format used for fetching comments
      queryClient.invalidateQueries({ queryKey: [`/api/blog/posts/`, post?.slug, `/comments/`] }); // Use queryClient to invalidate
      toast({
        title: t('blog.commentSubmitted'),
        description: t('blog.commentPendingApproval'), // Or check createdComment.approved if API returns it immediately
      });
      form.reset(); // Reset the form fields
      setShowCommentForm(false); // Hide the form

       // Optional: Manually add the comment to the cache if the API response
       // includes the approved comment and you want it to appear instantly.
       // This requires careful handling of pagination and approval status.
    },
    onError: (error: Error) => {
      // The thrown error from mutationFn will be available here
      toast({
        title: t('blog.commentError'),
        description: error.message, // Display the message from the thrown error
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  function onSubmit(data: CommentFormData) {
     // Ensure post slug is available before mutating
     if (!post?.slug) {
         toast({ title: "Error", description: "Post not loaded yet.", variant: "destructive" });
         return;
     }
     addCommentMutation.mutate(data); // Trigger the mutation
  }

  // Access the array of comments from the paginated response
  const comments = commentsResponse?.results || [];

  // Handle loading state for the main post query
  if (isPostLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
         <span className="ml-2 text-gray-600">Loading blog post...</span>
      </div>
    );
  }

  // Handle post not found or error fetching post (404 is handled in queryFn catch)
   if (!post || postError) {
       // postError would be set if the error in queryFn catch was re-thrown (e.g., not 404)
        // !post handles the case where the 404 was caught and queryFn returned null
        return (
             <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4 text-center">
               <h1 className="text-3xl font-bold text-red-600 mb-4">
                  {postError instanceof Error ? postError.message : t('blog.postNotFound')} {/* Display error message or not found */}
               </h1>
               {!(postError instanceof Error && postError.message === t('blog.postNotFound')) && (
                   // Only show description if it's not the specific "not found" error message
                    <p className="mb-8">{t('blog.postNotFoundDescription')}</p>
               )}

               <Link href="/blog">
                 <Button>{t('blog.backToBlog')}</Button>
               </Link>
             </div>
           );
   }

  // If post data is loaded successfully, render the post
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link href="/blog">
            <Button variant="link" className="pl-0">{t('blog.backToBlog')}</Button>
          </Link>
        </div>

        {/* Post Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Badge variant="secondary">
               {/* Use snake_case property: post.category */}
              {post.category.charAt(0).toUpperCase() + post.category.slice(1).replace('_', ' ')}
            </Badge>
             {/* Use snake_case property: post.published_at */}
            <span className="text-sm text-gray-500">
              {formatDate(post.published_at)}
            </span>
             {/* Use snake_case property: post.view_count */}
            <span className="text-sm text-gray-500">
              {post.view_count} {t('blog.views')}
            </span>
          </div>

           {/* Use snake_case property: post.title */}
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

           {/* Use snake_case property: post.excerpt */}
          {post.excerpt && (
            <p className="text-xl text-gray-600 mb-6">{post.excerpt}</p>
          )}

           {/* Use snake_case property: post.cover_image */}
          {post.cover_image && (
            <div className="rounded-lg overflow-hidden mb-8">
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full h-auto"
                 onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/800x400?text=No+Image'; e.currentTarget.onerror = null; }} // Add fallback
              />
            </div>
          )}
        </div>

        {/* Post Content */}
        <div className="prose prose-lg max-w-none mb-16">
           {/* Use snake_case property: post.content */}
           {/* Be cautious rendering raw HTML from backend unless you trust the source. */}
           {/* Ensure your backend sanitizes user-generated content if allowing HTML */}
          <div dangerouslySetInnerHTML={{
            __html: post.content
             // Simple markdown-like parsing (consider a dedicated markdown parser library for robustness)
              ?.replace(/^#{1}\s+(.+)$/gm, '<h1>$1</h1>')
              .replace(/^#{2}\s+(.+)$/gm, '<h2>$1</h2>')
              .replace(/^#{3}\s+(.+)$/gm, '<h3>$1</h3>')
              .replace(/^#{4}\s+(.+)$/gm, '<h4>$1</h4>')
              .replace(/^#{5}\s+(.+)$/gm, '<h5>$1</h5>')
              .replace(/^#{6}\s+(.+)$/gm, '<h6>$1</h6>')
              .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.+?)\*/g, '<em>$1</em>')
              .replace(/\n\n/g, '</p><p>') // Convert double newlines to paragraphs
              .replace(/^(?!<h|<p|<\/p|<br>|<img|.+>)\s*(.+)$/gm, '<p>$1</p>') // Basic paragraph wrapping for lines not already in tags
              .replace(/<p><\/p>/g, '') // Remove empty paragraphs
               || '' // Ensure content is at least an empty string
          }} />
        </div>

        {/* Tags */}
         {/* API schema says 'tags' is string, but curl output shows "[{"tag":"..."}]".
             Your original code expects string[], likely from previous backend or manual parsing.
             Let's parse it here for display if it's a string.
          */}
        {post.tags && (typeof post.tags === 'string' || Array.isArray(post.tags)) && (() => {
             let parsedTags: { tag: string }[] = [];
             if (typeof post.tags === 'string') {
                 try { parsedTags = JSON.parse(post.tags); } catch (e) { console.error("Failed to parse post tags string:", post.tags, e); }
             } else if (Array.isArray(post.tags)) {
                  // If API somehow returns array directly, map it
                  parsedTags = post.tags; // Assuming array of { tag: string } or just strings
             }

             // Ensure parsedTags is an array of objects with a 'tag' property
             const tagNames = Array.isArray(parsedTags) ? parsedTags.map(t => typeof t === 'object' && t !== null && 'tag' in t ? String(t.tag) : String(t)).filter(Boolean) : [];


             if (tagNames.length === 0) return null; // Don't render if no valid tags

             return (
                <div className="mb-12">
                  <h3 className="text-lg font-medium mb-3">{t('blog.tags')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {tagNames.map((tag, index) => (
                      <Badge key={index} variant="outline" className="capitalize">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
             );
        })()}


        <Separator className="my-12" />

        {/* Comments Section */}
        <div>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">
               {/* Use snake_case property: post.comments_count (from main post data) or comments.length (from comments query) */}
              {post.comments_count || comments.length || 0} {t('blog.comments')}
            </h2>
            {!showCommentForm && (
              <Button onClick={() => setShowCommentForm(true)}>
                {t('blog.addComment')}
              </Button>
            )}
          </div>

          {/* Comment Form */}
          {showCommentForm && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>{t('blog.addComment')}</CardTitle>
                <CardDescription>
                  {t('blog.commentsModerated')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('blog.name')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('blog.namePlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage /> {/* Displays Zod or Server errors */}
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('blog.email')}</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder={t('blog.emailPlaceholder')} {...field} />
                            </FormControl>
                            <FormDescription>
                              {t('blog.emailPrivacy')}
                            </FormDescription>
                            <FormMessage /> {/* Displays Zod or Server errors */}
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('blog.comment')}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t('blog.commentPlaceholder')}
                              rows={5}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage /> {/* Displays Zod or Server errors */}
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCommentForm(false)}
                        disabled={addCommentMutation.isPending} // Disable cancel while submitting
                      >
                        {t('blog.cancel')}
                      </Button>
                      <Button
                        type="submit"
                        disabled={addCommentMutation.isPending} // Disable submit while submitting
                      >
                        {addCommentMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {t('blog.submitComment')}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Comments List */}
          {isCommentsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
               <span className="ml-2 text-gray-600">Loading comments...</span>
            </div>
          ) : commentsError ? ( // Handle error fetching comments
             <div className="text-center py-8 text-red-600">
                 Error loading comments.
                 {commentsError instanceof Error && <p className="text-gray-600 italic">{commentsError.message}</p>}
             </div>
          ) : comments && comments.length > 0 ? ( // Check if comments array exists and is not empty
            <div className="space-y-6">
               {/* Map over the comments array */}
              {comments.map((comment) => (
                <Card key={comment.id}> {/* Use snake_case property: comment.id */}
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-4">
                       {/* Use snake_case property: comment.name */}
                      <Avatar>
                         {/* Use snake_case property: comment.name */}
                        <AvatarFallback>
                           {/* Safely access name property before substring */}
                          {comment.name?.substring(0, 2).toUpperCase() || '??'}
                        </AvatarFallback>
                         {/* If user has an avatar URL (snake_case: comment.user.avatar_url) */}
                         {/* <AvatarImage src={comment.user?.avatar_url} alt={comment.name} /> */}
                      </Avatar>
                      <div>
                         {/* Use snake_case property: comment.name */}
                        <CardTitle className="text-lg">{comment.name}</CardTitle>
                        <CardDescription>
                           {/* Use snake_case property: comment.created_at */}
                          {formatDate(comment.created_at)}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                     {/* Use snake_case property: comment.content */}
                    <p>{comment.content}</p>
                  </CardContent>
                   {/* Optional: Add comment footer for like/reply buttons */}
                   {/* <CardFooter className="flex justify-end">...</CardFooter> */}
                </Card>
              ))}
            </div>
           // Handle case where comments array is empty after loading
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>{t('blog.noComments')}</p>
              {!showCommentForm && (
                <Button
                  variant="link"
                  onClick={() => setShowCommentForm(true)}
                  className="mt-2"
                >
                  {t('blog.beFirstToComment')}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}