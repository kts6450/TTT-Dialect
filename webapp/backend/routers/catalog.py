"""카탈로그 라우터 — 체험 목록/검색."""

from fastapi import APIRouter, HTTPException

from services.catalog import (
    get_experience,
    list_experiences,
    load_catalog,
    search_experiences,
)

router = APIRouter(prefix="/api/catalog", tags=["catalog"])


@router.get("/brand")
def get_brand():
    return load_catalog()["brand"]


@router.get("/experiences")
def get_experiences(q: str | None = None):
    if q:
        return search_experiences(q)
    return list_experiences()


@router.get("/experiences/{exp_id}")
def get_experience_by_id(exp_id: str):
    exp = get_experience(exp_id)
    if exp is None:
        raise HTTPException(status_code=404, detail="experience not found")
    return exp
