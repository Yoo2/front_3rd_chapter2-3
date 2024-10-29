import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import PostsManagerHeader from "./ui/PostsManagerHeader"
import { User } from "./model/User"
import { Post } from "./model/Post"
import { Comment, Comments } from "./model/Comment"
import { Tag } from "./model/Tag"
import PostsManagerContent from "./ui/PostsManagerContent"
import AddPostDialog from "./ui/AddPostDialog"
import UpdatePostDialog from "./ui/UpdatePostDialog"
import { NewComment } from "./model/NewComment"
import AddCommentDialog from "./ui/AddCommentDialog"
import UpdateCommentDialog from "./ui/UpdateCommentDialog"
import PostDetailDialog from "./ui/PostDetailDialog"
import UserModal from "./ui/UserModal"
import { Card } from "../shared/ui/card/Card"

const PostsManager = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)

  // interface
  interface PostsData {
    posts: Post[]
    total: number
    skip: number
    limit: number
  }

  // 상태 관리
  const [posts, setPosts] = useState<Post[]>([])
  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(parseInt(queryParams.get("skip") || "0"))
  const [limit, setLimit] = useState(parseInt(queryParams.get("limit") || "10"))
  const [searchQuery, setSearchQuery] = useState(queryParams.get("search") || "")
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [sortBy, setSortBy] = useState(queryParams.get("sortBy") || "")
  const [sortOrder, setSortOrder] = useState(queryParams.get("sortOrder") || "asc")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [newPost, setNewPost] = useState({ title: "", body: "", userId: 1 })
  const [loading, setLoading] = useState(false)
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedTag, setSelectedTag] = useState(queryParams.get("tag") || "")
  const [comments, setComments] = useState<Comments>({})
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null)
  const [newComment, setNewComment] = useState<NewComment>({ body: "", postId: null, userId: 1 })
  const [showAddCommentDialog, setShowAddCommentDialog] = useState(false)
  const [showEditCommentDialog, setShowEditCommentDialog] = useState(false)
  const [showPostDetailDialog, setShowPostDetailDialog] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // URL 업데이트 함수
  const updateURL = () => {
    const params = new URLSearchParams()
    if (skip) params.set("skip", skip.toString())
    if (limit) params.set("limit", limit.toString())
    if (searchQuery) params.set("search", searchQuery)
    if (sortBy) params.set("sortBy", sortBy)
    if (sortOrder) params.set("sortOrder", sortOrder)
    if (selectedTag) params.set("tag", selectedTag)
    navigate(`?${params.toString()}`)
  }

  // 게시물 가져오기
  const fetchPosts = () => {
    setLoading(true)
    let postsData: PostsData
    let usersData: User[]

    fetch(`/api/posts?limit=${limit}&skip=${skip}`)
      .then((response) => response.json())
      .then((data) => {
        postsData = data
        return fetch("/api/users?limit=0&select=username,image")
      })
      .then((response) => response.json())
      .then((users) => {
        usersData = users.users
        const postsWithUsers = postsData.posts.map((post) => ({
          ...post,
          author: usersData.find((user) => user.id === post.userId),
        }))
        setPosts(postsWithUsers)
        setTotal(postsData.total)
      })
      .catch((error) => {
        console.error("게시물 가져오기 오류:", error)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  // 태그 가져오기
  const fetchTags = async () => {
    try {
      const response = await fetch("/api/posts/tags")
      const data = await response.json()
      setTags(data)
    } catch (error) {
      console.error("태그 가져오기 오류:", error)
    }
  }

  // 태그별 게시물 가져오기
  const fetchPostsByTag = async (tag: string) => {
    if (!tag || tag === "all") {
      fetchPosts()
      return
    }
    setLoading(true)
    try {
      const [postsResponse, usersResponse] = await Promise.all([
        fetch(`/api/posts/tag/${tag}`),
        fetch("/api/users?limit=0&select=username,image"),
      ])
      const postsData = await postsResponse.json()
      const usersData = await usersResponse.json()

      const postsWithUsers = postsData.posts.map((post: Post) => ({
        ...post,
        author: usersData.users.find((user: User) => user.id === post.userId),
      }))

      setPosts(postsWithUsers)
      setTotal(postsData.total)
    } catch (error) {
      console.error("태그별 게시물 가져오기 오류:", error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTags()
  }, [])

  useEffect(() => {
    if (selectedTag) {
      fetchPostsByTag(selectedTag)
    } else {
      fetchPosts()
    }
    updateURL()
  }, [skip, limit, sortBy, sortOrder, selectedTag])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    setSkip(parseInt(params.get("skip") || "0"))
    setLimit(parseInt(params.get("limit") || "10"))
    setSearchQuery(params.get("search") || "")
    setSortBy(params.get("sortBy") || "")
    setSortOrder(params.get("sortOrder") || "asc")
    setSelectedTag(params.get("tag") || "")
  }, [location.search])

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <PostsManagerHeader setShowAddDialog={setShowAddDialog} />
      <PostsManagerContent
        searchQuery={searchQuery}
        fetchPosts={fetchPosts}
        setLoading={setLoading}
        setPosts={setPosts}
        setTotal={setTotal}
        posts={posts}
        comments={comments}
        setComments={setComments}
        setSelectedPost={setSelectedPost}
        setShowPostDetailDialog={setShowPostDetailDialog}
        setSelectedUser={setSelectedUser}
        setShowUserModal={setShowUserModal}
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
        updateURL={updateURL}
        setShowEditDialog={setShowEditDialog}
        setSearchQuery={setSearchQuery}
        fetchPostsByTag={fetchPostsByTag}
        tags={tags}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        loading={loading}
        limit={limit}
        setLimit={setLimit}
        skip={skip}
        setSkip={setSkip}
        total={total}
      />

      <AddPostDialog
        showAddDialog={showAddDialog}
        setShowAddDialog={setShowAddDialog}
        newPost={newPost}
        setNewPost={setNewPost}
        setPosts={setPosts}
        posts={posts}
      />

      <UpdatePostDialog
        selectedPost={selectedPost}
        setPosts={setPosts}
        posts={posts}
        setShowEditDialog={setShowEditDialog}
        showEditDialog={showEditDialog}
        setSelectedPost={setSelectedPost}
      />

      <AddCommentDialog
        newComment={newComment}
        setComments={setComments}
        setShowAddCommentDialog={setShowAddCommentDialog}
        setNewComment={setNewComment}
        showAddCommentDialog={showAddCommentDialog}
      />

      <UpdateCommentDialog
        selectedComment={selectedComment}
        setComments={setComments}
        setShowEditCommentDialog={setShowEditCommentDialog}
        showEditCommentDialog={showEditCommentDialog}
        setSelectedComment={setSelectedComment}
      />
      <PostDetailDialog
        setNewComment={setNewComment}
        setShowAddCommentDialog={setShowAddCommentDialog}
        comments={comments}
        setSelectedComment={setSelectedComment}
        setShowEditCommentDialog={setShowEditCommentDialog}
        showPostDetailDialog={showPostDetailDialog}
        setShowPostDetailDialog={setShowPostDetailDialog}
        selectedPost={selectedPost}
        searchQuery={searchQuery}
        setComments={setComments}
      />

      <UserModal showUserModal={showUserModal} setShowUserModal={setShowUserModal} selectedUser={selectedUser} />
    </Card>
  )
}

export default PostsManager
